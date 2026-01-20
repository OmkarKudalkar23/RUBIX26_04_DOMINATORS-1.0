import '@/globals.css'

export const metadata = {
  title: 'Healthcare Risk & Resource Prediction',
  description: 'Real-time air quality monitoring and healthcare resource management',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
