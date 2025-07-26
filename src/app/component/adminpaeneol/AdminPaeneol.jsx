'use client'
import React, {useRef, useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import { checkAuthStore } from "@/app/zustand/store";
import styles from './AdminPaeneol.module.css';

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
        setVisible(blockPage.isBlockId({
            session:sessionStorage,
            type:'paeneol',
            idx:0,
            auth:'r',
        }));
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
        // Add touch event listeners for mobile compatibility
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return() => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [open]);

    return (
        visible ? (
            <div className={styles.adminPanelContainer}>
                {open && (
                    <div
                        className={styles.adminPanelOverlay}
                        onClick={() => setOpen(false)}
                    ></div>
                )}
                {/* 왼쪽 상단 버튼 */}
                <button className="admin-panel-btn" onClick={() => setOpen(v => !v)}>
                    관리 <br /> 패널
                </button>

                {/* 버튼 바로 오른쪽에 패널 */}
                <div
                    ref={panelRef}
                    className={`${styles.adminPanelSide} ${open ? styles.open : ''}`}
                >
                    <div className='flex align_center mb_20'>
                        <span className="admin-panel-header-title">관리패널</span>
                        <button
                            onClick={() => setOpen(false)}
                            className="admin-panel-close-btn"
                            title="닫기">×</button>
                    </div>
                    <ul className='flex flex_1 flex_column gap_10'>
                        {
                            links.map(item => (
                                <li key={item.id}>
                                    <button
                                        className="admin-panel-link"
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
            </div>
        ) : null
    );
}
