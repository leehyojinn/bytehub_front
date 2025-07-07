import "./globals.css";

export default function layout({children}) {
  return (
    <html lang="ko">
      
    <head>
        <meta charSet="utf-8" />
        <title>Document</title>
    </head>
    <body>
      {children}
    </body>
    </html>
  )
}
