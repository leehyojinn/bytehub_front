'use client'
import React, {useRef, useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import { checkAuthStore } from "@/app/zustand/store";

const links = [
    {
        id: 1,
        name: "키워드",
        link: "/component/keyword"
    }, {
        id: 2,
        name: "직원정보 수정",
        link: "/component/memberedit"
    }, {
        id: 3,
        name: "연차 수정",
        link: "/component/leaveedit"
    }, {
        id: 4,
        name: "근태정보 수정",
        link: "/component/attendanceedit"
    },
    {
        id: 5,
        name: "부서 생성",
        link: "/component/deptcreate"
    }, {
        id: 6,
        name: "직급 생성",
        link: "/component/gradecreate"
    }, {
        id: 7,
        name: "권한부여",
        link: "/component/permission"
    }, {
        id: 8,
        name: "통계",
        link: "/component/stat"
    }
];

export default function AdminPaeneol() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const panelRef = useRef();
    const [visible, setVisible] = useState(false);

    const blockPage= checkAuthStore();

    // 관리패널 보여주는 여부
    const showAdminPaeneol=()=>{
        setVisible(blockPage.isBlockId({session:sessionStorage}));
    }

    useEffect(() => {
        showAdminPaeneol();
    }, []);


    // 바깥 클릭 시 패널 닫기
    useEffect(() => {
        if (!open) 
            return;
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)){
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return() => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        visible ? <div
                style={{
                    position: 'relative',
                    zIndex: 100
                }}>
                {/* 왼쪽 상단 버튼 */}
                <button className="admin-panel-btn" onClick={() => setOpen(v => !v)}>
                    관리패널
                </button>

                {/* 버튼 바로 오른쪽에 패널 */}
                <div
                    ref={panelRef}
                    className="admin-panel-side"
                    style={{
                        position: 'fixed',
                        top: 32,
                        left: open
                            ? 172
                            : -340,
                        width: 340,
                        minHeight: 420,
                        maxHeight: '80vh',
                        background: '#fff',
                        boxShadow: open
                            ? '4px 4px 24px rgba(67,56,120,0.13)'
                            : 'none',
                        borderRadius: '14px',
                        border: '2px solid #ece6fa',
                        padding: '36px 30px 24px 30px',
                        transition: 'left 0.32s cubic-bezier(.4,0,.2,1), box-shadow 0.18s',
                        zIndex: 130,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                    <div className='flex align_center mb_20'>
                    <span
                        style={{
                            fontWeight: 800,
                            fontSize: '1.27rem',
                            color: '#433878',
                            letterSpacing: '-1px'
                        }}>관리패널</span>
                        <button
                            onClick={() => setOpen(false)}
                            style={{
                                marginLeft: 'auto',
                                background: 'none',
                                border: 'none',
                                fontSize: '2rem',
                                color: '#bbb',
                                cursor: 'pointer',
                                transition: 'color 0.18s'
                            }}
                            title="닫기">×</button>
                    </div>
                    <ul className='flex flex_1 flex_column gap_10'>
                        {
                            links.map(item => (
                                <li key={item.id}>
                                    <button
                                        className="admin-panel-link"
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            background: '#faf8ff',
                                            color: '#433878',
                                            border: 'none',
                                            borderRadius: '7px',
                                            padding: '13px 18px',
                                            fontSize: '1.07rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'background 0.16s, color 0.16s'
                                        }}
                                        onClick={() => {
                                            setOpen(false);
                                            router.push(item.link);
                                        }}>
                                        {item.name}
                                    </button>
                                </li>
                            ))
                        }
                    </ul>
                </div>
            </div> : null
    );
}
