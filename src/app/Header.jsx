import React from 'react'
import Link from 'next/link'
import ChatbotWidget from './component/chatbot/Chatbot';
import Chatbot from './component/chatbot/Chatbot';
import AdminPaeneol from './component/adminpaeneol/AdminPaeneol';

const menuItems = [
  { name: '출결 확인', href: '/component/attendance' },
  { name: '프로젝트', href: '/component/project' },
  { name: '결재', href: '/component/approval' },
  { name: '채팅', href: '/component/chating' },
  { name: '일정', href: '/component/calendar' },
  { name: '조직도', href: '/component/organization' },
  { name: '비상연락망', href: '/component/emergency' },
  { name: '파일', href: '/component/files' },
  { name: '회의록', href: '/component/meeting' },
  { name: '공지사항', href: '/component/board' },
];

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Header() {

    // 로그아웃 핸들러
    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            // 백엔드 로그아웃 API 호출
            await fetch(`${apiUrl}/member/logout`, {
                method: 'POST',
                credentials: 'include', // 세션 기반이면 필요
            });
            // 로컬스토리지/세션스토리지 토큰 삭제
            // sessionStorage.removeItem('token');
            // sessionStorage.removeItem('userId');

            sessionStorage.clear();


            // 메인 또는 로그인 페이지로 이동
            window.location.href = '/';
            alert('로그아웃 되었습니다.')
        } catch (error) {
            alert('로그아웃 중 오류가 발생했습니다.');
        }
    };

  return (
    <div className='bg_tertiary widht_100'>
        <div className='wrap'>
        <div className='header'>
            <div>
                <Link href={"/component/main"}>
                <img style={{ width: "200px" }} src="/logo.png" alt="logo" />
                </Link>
            </div>
            <ul className='flex gap_10'>
            {menuItems.map(item => (
                <li className='su_small_text font_500 links' key={item.href}>
                <Link href={item.href}>{item.name}</Link>
                </li>
            ))}
            </ul>
            <ul className='flex gap_10'>
              <li className='su_small_text font_500 links'>
                <a href="#" onClick={handleLogout}>로그아웃</a>
              </li>
              <li className='su_small_text font_500 links'>
                <Link href={"/component/mypage"}>마이페이지</Link>
              </li>
            </ul>
        </div>
        </div>
        <AdminPaeneol/>
        <Chatbot/>
    </div>
  )
}
