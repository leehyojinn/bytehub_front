import "./globals.css";
import AlertModal from "./component/alertmodal/page";
import AuthWrapper from "./component/AuthWrapper";

export default function layout({children}) {
  return (
    <html lang="ko">
      
    <head>
        <meta charSet="utf-8" />
        <title>Document</title>
    </head>
    <body>
      <AlertModal />
      <AuthWrapper>
        {children}
      </AuthWrapper>
    </body>
    </html>
  )
}
