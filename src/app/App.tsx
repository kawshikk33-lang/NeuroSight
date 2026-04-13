import { RouterProvider } from 'react-router'

import { ReactQueryProvider } from './providers/ReactQueryProvider'
import { router } from './routes'

export default function App() {
  return (
    <ReactQueryProvider>
      <RouterProvider router={router} />
    </ReactQueryProvider>
  )
}
