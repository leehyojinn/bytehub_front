import Link from 'next/link';
import React from 'react';

export default function Footer() {
  return (
    <div className='width_100 bg_tertiary'>
        <footer className="wrap">
        <div className="footer">
            <div className='footer_inner'>
                <Link href="/component/main" className="footer_logo">
                <img src="/logo.png" alt="logo" style={{width:"120px"}} />
                </Link>
                <div className="footer_info su_small_text">
                © 2025 Bytehub. All rights reserved. | 문의: 777gin@naver.com
                </div>
                <div className="links su_small_text">
                <a href="#">이용약관</a>
                <span className="footer_divider">|</span>
                <a href="#">개인정보처리방침</a>
                </div>
            </div>
        </div>
        </footer>
    </div>
  );
}
