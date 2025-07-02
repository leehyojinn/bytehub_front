'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, {useState} from "react";
import {useAlertModalStore} from "@/app/zustand/store";
import AlertModal from "../alertmodal/page";
import CountUp from 'react-countup';

const memberData = {
    id: "hong123",
    name: "홍길동",
    email: "hong@bytehub.com",
    dept_id: 2,
    position: "팀장",
    grade: "A",
    hire_date: "2022-01-01",
    phone: "010-1111-2222",
    profile_img: "profile.png"
};

const departments = [
    {
        id: 1,
        name: "경영지원팀"
    }, {
        id: 2,
        name: "개발팀"
    }, {
        id: 3,
        name: "디자인팀"
    }
];

const leaves = [
    {
        leave_idx: 1,
        user_id: "hong123",
        start_date: "2025-06-01",
        end_date: "2025-06-02",
        status: "승인"
    }, {
        leave_idx: 2,
        user_id: "hong123",
        start_date: "2025-07-01",
        end_date: "2025-07-03",
        status: "대기"
    }
];

const TOTAL_LEAVE = 15;
const usedLeave = leaves
    .filter(l => l.status === "승인")
    .length;
const remainLeave = TOTAL_LEAVE - usedLeave;

export default function MyPage() {
    const dept = departments.find(d => d.id === memberData.dept_id);
    const profileUrl = memberData.profile_img
        ? `/${memberData.profile_img}`
        : "/profile/default_avatar.png";

    // 모달 상태
    const [pwModalOpen, setPwModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);

    // 비밀번호 입력 상태
    const [passwordInput, setPasswordInput] = useState("");

    // 회원정보 수정 상태 (연락처, 이메일, 비밀번호)
    const [editInfo, setEditInfo] = useState(
        {phone: memberData.phone, email: memberData.email, password: ""}
    );

    // zustand alert modal
    const alertModal = useAlertModalStore();

    // 비밀번호 확인
    const handlePwConfirm = (e) => {
        e.preventDefault();
        if (passwordInput === "1234") { // 예시 비밀번호
            setPwModalOpen(false);
            setEditModalOpen(true);
            setPasswordInput("");
        } else {
            alertModal.openModal(
                {svg: '❗', msg1: "비밀번호 오류", msg2: "비밀번호가 틀렸습니다.", showCancel: false}
            );
        }
    };

    // 수정 정보 변경
    const handleEditChange = (e) => {
        const {name, value} = e.target;
        setEditInfo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 정보 저장
    const handleSave = (e) => {
        e.preventDefault();
        alertModal.openModal({
            svg: '🔔',
            msg1: "정보 수정 완료",
            msg2: `연락처: ${editInfo.phone}\n이메일: ${editInfo.email}`,
            showCancel: false,
            onConfirm: () => setEditModalOpen(false)
        });
    };

    return (
        <div>
            <Header/>
            <div className="wrap padding_60_0">
                <div className="main_box flex flex_column align_center justify_center gap_20">
                    <h2 className="card_title font_700 mb_0">마이페이지</h2>
                    <div className="mypage_card_v2">
                        <div className="mypage_profile_col">
                            <div className="mypage_profile_imgbox">
                                <img
                                    src={profileUrl}
                                    alt="프로필"
                                    className="mypage_profile_img"
                                    onError={e => {
                                        e.currentTarget.src = "/profile/default_avatar.png";
                                    }}/>
                            </div>
                            <div className="mypage_profile_name">{memberData.name}</div>
                            <div className="mypage_profile_position">{
                                    dept
                                        ?.name
                                }
                                / {memberData.position}</div>
                        </div>
                        <div className="mypage_info_col">
                            <div className="mypage_section_v2">
                                <div className="mypage_title_v2">회원 정보</div>
                                <div className="mypage_info_grid">
                                    <div>
                                        <span className="mypage_info_label">아이디</span>
                                        <span className="mypage_info_value">{memberData.id}</span>
                                    </div>
                                    <div>
                                        <span className="mypage_info_label">이메일</span>
                                        <span className="mypage_info_value">{memberData.email}</span>
                                    </div>
                                    <div>
                                        <span className="mypage_info_label">직급</span>
                                        <span className="mypage_info_value">{memberData.grade}</span>
                                    </div>
                                    <div>
                                        <span className="mypage_info_label">입사일</span>
                                        <span className="mypage_info_value">{memberData.hire_date}</span>
                                    </div>
                                    <div>
                                        <span className="mypage_info_label">연락처</span>
                                        <span className="mypage_info_value">{memberData.phone}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mypage_section_v2">
                                <div className="mypage_title_v2">연차</div>
                                <div className="mypage_leave_grid">
                                    <div className="mypage_leave_item total">
                                        <span className="leave_title">총 연차</span>
                                        <b><CountUp end={TOTAL_LEAVE} />일</b>
                                    </div>
                                    <div className="mypage_leave_item used">
                                        <span className="leave_title">사용</span>
                                        <b>
                                            <CountUp end={usedLeave} />일
                                        </b>
                                    </div>
                                    <div className="mypage_leave_item remain">
                                        <span className="leave_title">남음</span>
                                        <b>
                                            <CountUp end={remainLeave} />일
                                        </b>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className="board_btn" onClick={() => setPwModalOpen(true)}>정보수정</button>
                </div>
            </div>
            <Footer/> {/* 비밀번호 확인 모달 */}
            {
                pwModalOpen && (
                    <div className="modal_overlay" onClick={() => setPwModalOpen(false)}>
                        <div className="modal_content" onClick={e => e.stopPropagation()}>
                            <h3 className="card_title font_700 mb_20">비밀번호 확인</h3>
                            <form className="flex flex_column gap_20" onSubmit={handlePwConfirm}>
                                <div className="board_write_row">
                                    <label htmlFor="password" className="board_write_label">비밀번호</label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        className="board_write_input"
                                        value={passwordInput}
                                        onChange={e => setPasswordInput(e.target.value)}
                                        required="required"
                                        autoFocus="autoFocus"/>
                                </div>
                                <div className="modal_buttons">
                                    <button type="submit" className="board_btn">확인</button>
                                    <button
                                        type="button"
                                        className="board_btn board_btn_cancel"
                                        onClick={() => setPwModalOpen(false)}>취소</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* 정보 수정 모달 */}
            {
                editModalOpen && (
                    <div className="modal_overlay" onClick={() => setEditModalOpen(false)}>
                        <div className="modal_content" onClick={e => e.stopPropagation()}>
                            <h3 className="card_title font_700 mb_20">회원 정보 수정</h3>
                            <form className="flex flex_column gap_10" onSubmit={handleSave}>
                                <div className="board_write_row">
                                    <label htmlFor="phone" className="board_write_label">연락처</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="text"
                                        className="board_write_input"
                                        value={editInfo.phone}
                                        onChange={handleEditChange}
                                        required="required"/>
                                </div>
                                <div className="board_write_row">
                                    <label htmlFor="email" className="board_write_label">이메일</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        className="board_write_input"
                                        value={editInfo.email}
                                        onChange={handleEditChange}
                                        required="required"/>
                                </div>
                                <div className="board_write_row">
                                    <label htmlFor="new_password" className="board_write_label">새 비밀번호</label>
                                    <input
                                        id="new_password"
                                        name="new_password"
                                        type="password"
                                        className="board_write_input"
                                        value={editInfo.password}
                                        onChange={handleEditChange}
                                        placeholder="변경할 비밀번호를 입력하세요"/>
                                </div>
                                <div className="modal_buttons">
                                    <button type="submit" className="board_btn">저장</button>
                                    <button
                                        type="button"
                                        className="board_btn board_btn_cancel"
                                        onClick={() => setEditModalOpen(false)}>취소</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            <AlertModal/>
        </div>
    );
}
