"""Alert evaluation service — checks metrics against user-defined thresholds."""
import math
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import func as sql_func
from sqlalchemy.orm import Session

from app.models.alert_rule import AlertNotification, AlertRule

# Predefined metric metadata for smart recommendations
METRIC_META = {
    "revenue": {"unit": "$", "severity_threshold": 0.15},
    "customers": {"unit": "", "severity_threshold": 0.10},
    "growth": {"unit": "%", "severity_threshold": 0.20},
    "churn_rate": {"unit": "%", "severity_threshold": 0.05},
    "rmse": {"unit": "", "severity_threshold": 0.10},
    "mape": {"unit": "%", "severity_threshold": 0.10},
    "r2": {"unit": "", "severity_threshold": 0.05},
    "forecast_value": {"unit": "$", "severity_threshold": 0.20},
    "active_customers": {"unit": "", "severity_threshold": 0.10},
}

RECOMMENDED_ACTIONS = {
    "revenue": {
        "below": "Review pricing strategy, check for data pipeline issues, and analyze recent order trends.",
        "above": "Revenue is strong — consider increasing ad spend or inventory.",
    },
    "customers": {
        "below": "Investigate customer acquisition channels. Check for churn or onboarding issues.",
        "above": "Customer growth is healthy — ensure support capacity scales accordingly.",
    },
    "growth": {
        "below": "Analyze market trends and competitor activity. Consider promotional campaigns.",
        "above": "Growth momentum is strong — capitalize on current strategies.",
    },
    "churn_rate": {
        "above": "Urgent: Identify churn drivers. Reach out to at-risk customers and review product experience.",
        "below": "Churn is under control — maintain current retention strategies.",
    },
    "rmse": {
        "above": "Model accuracy has degraded. Consider retraining with recent data.",
    },
    "mape": {
        "above": "Forecast error has increased. Review model features and retrain.",
    },
    "r2": {
        "below": "Model explanatory power has decreased. Investigate feature drift.",
    },
    "forecast_value": {
        "below": "Forecasted values are below threshold. Review demand assumptions.",
        "above": "Forecast exceeds threshold — plan inventory and capacity accordingly.",
    },
    "active_customers": {
        "below": "Active customer base declining. Run engagement campaigns and analyze usage patterns.",
        "above": "Active customer count is strong — ensure infrastructure can handle load.",
    },
}


class AlertService:
    """Service to evaluate alert rules against incoming metric values."""

    @staticmethod
    def check_and_trigger(
        db: Session,
        user_id: int,
        metric: str,
        current_value: float,
        historical_values: list[float] | None = None,
    ) -> list[AlertNotification]:
        """Check all active rules for a user+metric and trigger notifications if breached.

        Returns list of newly created AlertNotification objects.
        """
        rules = (
            db.query(AlertRule)
            .filter(
                AlertRule.user_id == user_id,
                AlertRule.metric == metric,
                AlertRule.is_active == True,
            )
            .all()
        )

        triggered = []
        now = datetime.now()

        for rule in rules:
            # Check cooldown
            if rule.last_triggered_at:
                elapsed = (now - rule.last_triggered_at).total_seconds()
                if elapsed < rule.cooldown_seconds:
                    continue

            breached = False
            title = ""
            message = ""
            severity = "warning"
            trend_str: str | None = None

            if rule.condition == "anomaly" and historical_values and len(historical_values) >= 3:
                breached, title, message, severity, trend_str = AlertService._check_anomaly(
                    rule, current_value, historical_values
                )
            elif rule.threshold_value is not None:
                breached, title, message, severity, trend_str = AlertService._check_threshold(
                    rule, current_value
                )

            if breached:
                notification = AlertService._create_notification(
                    db=db,
                    rule=rule,
                    current_value=current_value,
                    title=title,
                    message=message,
                    severity=severity,
                    trend=trend_str,
                )
                triggered.append(notification)

                # Update last triggered
                rule.last_triggered_at = now

        db.flush()
        return triggered

    @staticmethod
    def _check_threshold(rule: AlertRule, value: float):
        """Check simple threshold conditions."""
        threshold = rule.threshold_value
        meta = METRIC_META.get(rule.metric, {"unit": "", "severity_threshold": 0.15})
        unit = meta["unit"]
        sev_threshold = meta["severity_threshold"]

        breached = False
        title = ""
        message = ""

        if rule.condition == "below" and value < threshold:
            breached = True
            pct = round((threshold - value) / threshold * 100, 1) if threshold != 0 else 0
            title = f"⚠ {rule.name}"
            message = (
                f"{rule.metric.replace('_', ' ').title()} dropped to {value}{unit}, "
                f"which is {pct}% below the threshold of {threshold}{unit}."
            )
        elif rule.condition == "above" and value > threshold:
            breached = True
            pct = round((value - threshold) / threshold * 100, 1) if threshold != 0 else 0
            title = f"📈 {rule.name}"
            message = (
                f"{rule.metric.replace('_', ' ').title()} rose to {value}{unit}, "
                f"which is {pct}% above the threshold of {threshold}{unit}."
            )
        elif rule.condition == "equal" and abs(value - threshold) < 0.001:
            breached = True
            title = f"🎯 {rule.name}"
            message = f"{rule.metric.replace('_', ' ').title()} hit exactly {threshold}{unit}."

        if not breached:
            return False, "", "", "warning", None

        severity = "critical" if abs(value - (threshold or 0)) / max(abs(threshold), 1) > sev_threshold else "warning"

        # Determine trend hint
        trend_str = "Monitoring..."

        return breached, title, message, severity, trend_str

    @staticmethod
    def _check_anomaly(rule: AlertRule, value: float, history: list[float]):
        """Detect anomalies using statistical methods (Z-score / 3σ)."""
        n = len(history)
        if n < 3:
            return False, "", "", "warning", None

        mean = sum(history) / n
        variance = sum((x - mean) ** 2 for x in history) / n
        std_dev = math.sqrt(variance) if variance > 0 else 0

        if std_dev == 0:
            # All values identical — if current differs, it's anomalous
            if value != mean:
                return True, "🚨 Anomaly Detected", (
                    f"{rule.metric.replace('_', ' ').title()} value of {value} "
                    f"deviates from the baseline (all historical values were {mean})."
                ), "critical", f"σ=0, mean={mean:.2f}"
            return False, "", "", "warning", None

        z_score = abs(value - mean) / std_dev
        sigma = rule.anomaly_std_devs

        if z_score > sigma:
            direction = "above" if value > mean else "below"
            title = f"🚨 Anomaly: {rule.name}"
            message = (
                f"{rule.metric.replace('_', ' ').title()} value of {value} is "
                f"{z_score:.1f} standard deviations from the mean ({mean:.2f}, σ={std_dev:.2f}). "
                f"This is {direction} the normal range (>{sigma}σ threshold)."
            )
            severity = "critical" if z_score > sigma * 1.5 else "warning"
            trend_str = f"μ={mean:.2f}, σ={std_dev:.2f}, z={z_score:.1f}"
            return True, title, message, severity, trend_str

        return False, "", "", "warning", None

    @staticmethod
    def _create_notification(
        db: Session,
        rule: AlertRule,
        current_value: float,
        title: str,
        message: str,
        severity: str,
        trend: str | None = None,
    ) -> AlertNotification:
        """Create and persist an alert notification."""
        # Get recommended action
        meta = METRIC_META.get(rule.metric, {})
        action_key = rule.condition if rule.condition != "anomaly" else (
            "above" if "above" in message.lower() or "rose" in message.lower() else "below"
        )
        recommended = RECOMMENDED_ACTIONS.get(rule.metric, {}).get(action_key, "")

        notification = AlertNotification(
            user_id=rule.user_id,
            rule_id=rule.id,
            metric=rule.metric,
            current_value=current_value,
            threshold_value=rule.threshold_value,
            condition=rule.condition,
            title=title,
            message=message,
            severity=severity,
            trend=trend,
            recommended_action=recommended,
            context_data={},
        )
        db.add(notification)
        return notification

    @staticmethod
    def get_stats(db: Session, user_id: int, days: int = 7) -> dict:
        """Get alert statistics for a user."""
        cutoff = datetime.now() - timedelta(days=days)

        total = (
            db.query(AlertNotification)
            .filter(
                AlertNotification.user_id == user_id,
                AlertNotification.created_at >= cutoff,
            )
            .count()
        )

        unread = (
            db.query(AlertNotification)
            .filter(
                AlertNotification.user_id == user_id,
                AlertNotification.is_read == False,
            )
            .count()
        )

        critical = (
            db.query(AlertNotification)
            .filter(
                AlertNotification.user_id == user_id,
                AlertNotification.created_at >= cutoff,
                AlertNotification.severity == "critical",
            )
            .count()
        )

        by_metric: dict[str, int] = {}
        for metric, count in (
            db.query(AlertNotification.metric, sql_func.count(AlertNotification.id))
            .filter(
                AlertNotification.user_id == user_id,
                AlertNotification.created_at >= cutoff,
            )
            .group_by(AlertNotification.metric)
            .all()
        ):
            by_metric[metric] = count

        active_rules = (
            db.query(AlertRule)
            .filter(
                AlertRule.user_id == user_id,
                AlertRule.is_active == True,
            )
            .count()
        )

        return {
            "total_alerts": total,
            "unread": unread,
            "critical": critical,
            "by_metric": by_metric,
            "active_rules": active_rules,
            "period_days": days,
        }
