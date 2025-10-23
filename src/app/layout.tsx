export const metadata = {
  title: 'Tea App Removal Service',
  description: 'Professional DMCA takedown notice submission service',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
