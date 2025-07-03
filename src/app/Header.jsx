import React from 'react'
import Link from 'next/link'
import ChatbotWidget from './component/chatbot/Chatbot';
import Chatbot from './component/chatbot/Chatbot';
import AdminPaeneol from './component/adminpaeneol/AdminPaeneol';

const menuItems = [
  { name: '근태 관리', href: '/component/attendance' },
  { name: '프로젝트 관리', href: '/component/project' },
  { name: '결재 시스템', href: '/component/approval' },
  { name: '채팅', href: '/component/chating' },
  { name: '일정관리', href: '/component/calendar' },
  { name: '조직도', href: '/component/organization' },
  { name: '비상연락망', href: '/component/emergency' },
  { name: '파일 시스템', href: '/component/files' },
  { name: '회의록', href: '/component/meeting' },
  { name: '게시판', href: '/component/board' },
];

export default function Header() {
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
                <a>로그아웃</a>
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
