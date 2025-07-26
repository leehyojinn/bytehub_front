import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Chatbot from './component/chatbot/Chatbot';
import AdminPaeneol from './component/adminpaeneol/AdminPaeneol';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
import {checkAuthStore} from "@/app/zustand/store";

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
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [connected, setConnected] = useState(false);
    const stompClientRef = useRef(null);
    const subscriptionRef = useRef(null);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    /* ----------권한부분 ----------*/
    const block = checkAuthStore();
    const userLevelRef=useRef(null);
    const visibleRef=useRef(false);

    useEffect(() => {
        if(sessionStorage){
            callUserInfo();
        }
    },[])

    const callUserInfo = async () => {
        let {data} = await axios.get(`${apiUrl}/mypage/info`, {headers: {Authorization: sessionStorage.getItem('token')}});
        userLevelRef.current = data.data.lv_idx;
        visibleRef.current = block.checkUserLv({user_lv: userLevelRef.current, authLevel: 5});
    }

    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${apiUrl}/member/logout`, {
                method: 'POST',
                credentials: 'include',
            });
            sessionStorage.clear();
            window.location.href = '/';
            alert('로그아웃 되었습니다.')
        } catch (error) {
            alert('로그아웃 중 오류가 발생했습니다.');
        }
    };

    const fetchNotifications = async () => {
        try {
            const userId = sessionStorage.getItem('userId');
            if (!userId) return;

            const response = await axios.get(`${apiUrl}/notification/unread?user_id=${userId}`);
            if (response.data.success) {
                setNotifications(response.data.data);
                setUnreadCount(response.data.count);
            }
        } catch (error) {
            console.error('알림 조회 실패:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const userId = sessionStorage.getItem('userId');
            if (!userId) return;

            const response = await axios.post(`${apiUrl}/notification/read/${notificationId}`, {
                user_id: userId
            });
            
            if (response.data.success) {
                setNotifications(prev => 
                    prev.map(n => 
                        n.notification_id === notificationId 
                            ? { ...n, read: true }
                            : n
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('알림 읽음 처리 실패:', error);
        }
    };

    useEffect(() => {
        const userId = sessionStorage.getItem('userId');
        if (!userId) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            reconnectDelay: 5000,
            debug: function (str) {},
            onConnect: () => {
                setConnected(true);
                console.log('알림 WebSocket 연결됨');
            },
            onDisconnect: () => {
                setConnected(false);
                console.log('알림 WebSocket 연결 해제됨');
            }
        });

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
            client.deactivate();
        };
    }, []);

    useEffect(() => {
        const userId = sessionStorage.getItem('userId');
        if (!connected || !userId || !stompClientRef.current) return;

        subscriptionRef.current = stompClientRef.current.subscribe(
            `/topic/notification/${userId}`,
            (message) => {
                const notification = JSON.parse(message.body);
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
                
                if (Notification.permission === 'granted') {
                    new Notification(notification.title, {
                        body: notification.content,
                        icon: '/logo.png'
                    });
                }
            }
        );

        return () => {
            if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
        };
    }, [connected]);

    useEffect(() => {
        fetchNotifications();
        
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const toggleNotificationModal = () => {
        setShowNotificationModal(!showNotificationModal);
    };

    const markAllAsRead = async () => {
        try {
            const userId = sessionStorage.getItem('userId');
            if (!userId) return;

            for (const notification of notifications) {
                if (!notification.read) {
                    await markAsRead(notification.notification_id);
                }
            }
        } catch (error) {
            console.error('모든 알림 읽음 처리 실패:', error);
        }
    };


  return (
    <div className='bg_tertiary widht_100'>
        <div className='wrap'>
        <div className='header'>
            <div>
                <Link href={"/component/main"}>
                    <img style={{width: "150px"}} src="/logo.png" alt="logo"/>
                </Link>
            </div>
            <ul className='flex gap_10 desktop_menu'>
                {menuItems.map(item => {
                        if (item.name === '비상연락망') {
                            return visibleRef.current ? <li className='su_small_text font_500 links' key={item.href}>
                                <Link href={item.href}>{item.name}</Link>
                            </li> : null;
                        }
                        return (
                            <li className='su_small_text font_500 links' key={item.href}>
                                <Link href={item.href}>{item.name}</Link>
                            </li>
                        );
                    }
                )}
            </ul>
            {/* 데스크톱 메뉴에서 알림 아이콘 분리 */}
            <div className='flex gap_10 desktop_menu_right'> {/* 새로운 div 추가 */}
              <li className='su_small_text font_500 links'>
                <a href="#" onClick={handleLogout}>로그아웃</a>
              </li>
              <li className='su_small_text font_500 links'>
                <Link href={"/component/mypage"}>마이페이지</Link>
              </li>
              {/* 알림 아이콘을 이 div 안으로 이동 */}
              <li className='su_small_text font_500 links header_notification_icon'> {/* 새로운 클래스 추가 */}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleNotificationModal();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    position: 'relative'
                  }}
                >
                  <span style={{fontSize: '14px'}}>🔔</span>
                  <span>알림</span>
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#ff4757',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </a>
              </li>
            </div>
            {/* 모바일에서만 보일 알림 아이콘과 햄버거 버튼을 감싸는 div 추가 */}
            <div className="mobile_header_icons">
              <li className='su_small_text font_500 links header_notification_icon_mobile'> {/* 새로운 클래스 추가 */}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleNotificationModal();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    position: 'relative'
                  }}
                >
                  <span style={{fontSize: '14px'}}>🔔</span>
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#ff4757',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </a>
              </li>
              <button className="mobile_menu_icon" onClick={toggleMenu}>☰</button>
            </div>
        </div>
        </div>
        <div className={`mobile_menu ${isMenuOpen ? 'active' : ''}`}>
          <ul>
            {menuItems.map(item => {
                if (item.name === '비상연락망') {
                    return visibleRef.current ? <li className='su_small_text font_500 links' key={item.href}>
                        <Link href={item.href}>{item.name}</Link>
                    </li> : null;
                }
                return (
                    <li className='su_small_text font_500 links' key={item.href}>
                        <Link href={item.href}>{item.name}</Link>
                    </li>
                );
            })}
             <li className='su_small_text font_500 links'>
                <a href="#" onClick={handleLogout}>로그아웃</a>
              </li>
              <li className='su_small_text font_500 links'>
                <Link href={"/component/mypage"}>마이페이지</Link>
              </li>
          </ul>
        </div>
        <AdminPaeneol/>
        <Chatbot/>

        {showNotificationModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            zIndex: 1000,
            paddingTop: '80px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '400px',
              maxHeight: '500px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                  알림 ({unreadCount}개)
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      style={{
                        background: 'none',
                        border: '1px solid #007bff',
                        color: '#007bff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      모두 읽음
                    </button>
                  )}
                  <button
                    onClick={toggleNotificationModal}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '18px',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div style={{
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {notifications.length === 0 ? (
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#666'
                  }}>
                    새로운 알림이 없습니다.
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <div
                      key={notification.notification_id || index}
                      style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid #f0f0f0',
                        backgroundColor: notification.read ? 'white' : '#f8f9ff',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => markAsRead(notification.notification_id)}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: notification.read ? 'normal' : 'bold',
                            fontSize: '14px',
                            marginBottom: '4px',
                            color: notification.read ? '#666' : '#333'
                          }}>
                            {notification.title}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#666',
                            lineHeight: '1.4'
                          }}>
                            {notification.content}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: '#999',
                            marginTop: '4px'
                          }}>
                            {new Date(notification.created_at).toLocaleString('ko-KR')}
                          </div>
                        </div>
                        {!notification.read && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#007bff',
                            flexShrink: 0,
                            marginTop: '4px'
                          }} />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
