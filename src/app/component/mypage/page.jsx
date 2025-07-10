'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, {useState, useEffect} from "react";
import {useAlertModalStore} from "@/app/zustand/store";
import AlertModal from "../alertmodal/page";
import CountUp from 'react-countup';

// 임시 데이터 (백엔드 연동 전까지 사용)
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
    // 사용자 정보 상태
    const [memberData, setMemberData] = useState({
        id: "",
        name: "",
        email: "",
        dept_name: "",
        lv_name: "",
        hire_date: ""
    });

    // 로딩 상태
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 모달 상태
    const [pwModalOpen, setPwModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);

    // 비밀번호 입력 상태
    const [passwordInput, setPasswordInput] = useState("");

    // 회원정보 수정 상태 (이메일, 비밀번호)
    const [editInfo, setEditInfo] = useState({
        email: "",
        password: ""
    });

    // zustand alert modal
    const alertModal = useAlertModalStore();

    // 토큰 가져오기
    const getToken = () => {
        return sessionStorage.getItem('token');
    };

    // 컴포넌트 마운트 시 사용자 정보 가져오기
    useEffect(() => {
        fetchUserInfo();
    }, []);

    // 사용자 정보 가져오기
    const fetchUserInfo = async () => {
        try {
            const token = getToken();
            if (!token) {
                setError('로그인이 필요합니다.');
                alertModal.openModal({
                    svg: '❗',
                    msg1: "로그인 필요",
                    msg2: '로그인이 필요합니다.',
                    showCancel: false
                });
                return;
            }

            const response = await fetch('http://localhost/mypage/info', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                }
            });

            const data = await response.json();

            if (data.success) {
                const userInfo = data.data;
                console.log('서버 사용자 정보:', userInfo);
                setMemberData({
                    id: userInfo.id || userInfo.user_id || "",
                    name: userInfo.name,
                    email: userInfo.email,
                    dept_name: userInfo.dept_name || userInfo.department || userInfo.dept || '미지정',
                    lv_name: userInfo.lv_name || '미지정',
                    hire_date: userInfo.hire_date
                });

                // 수정 폼 초기값 설정
                setEditInfo({
                    email: userInfo.email,
                    password: ""
                });
            } else {
                setError(data.message);
                alertModal.openModal({
                    svg: '❗',
                    msg1: "오류",
                    msg2: data.message,
                    showCancel: false
                });
            }
        } catch (error) {
            console.error('사용자 정보 조회 오류:', error);
            setError('사용자 정보를 가져오는데 실패했습니다.');
            alertModal.openModal({
                svg: '❗',
                msg1: "오류",
                msg2: '사용자 정보를 가져오는데 실패했습니다.',
                showCancel: false
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 비밀번호 확인
    const handlePwConfirm = async (e) => {
        e.preventDefault();

        try {
            const token = getToken();
            if (!token) {
                alertModal.openModal({
                    svg: '❗',
                    msg1: "로그인 필요",
                    msg2: '로그인이 필요합니다.',
                    showCancel: false
                });
                return;
            }

            const response = await fetch('http://localhost/mypage/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({
                    password: passwordInput,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setPwModalOpen(false);
                setEditModalOpen(true);
                setPasswordInput("");
            } else {
                alertModal.openModal({
                    svg: '❗',
                    msg1: "비밀번호 오류",
                    msg2: data.message || "비밀번호가 틀렸습니다.",
                    showCancel: false
                });
            }
        } catch (error) {
            console.error('비밀번호 확인 오류:', error);
            alertModal.openModal({
                svg: '❗',
                msg1: "오류",
                msg2: "비밀번호 확인 중 오류가 발생했습니다.",
                showCancel: false
            });
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
    const handleSave = async (e) => {
        e.preventDefault();

        try {
            const token = getToken();
            if (!token) {
                alertModal.openModal({
                    svg: '❗',
                    msg1: "로그인 필요",
                    msg2: '로그인이 필요합니다.',
                    showCancel: false
                });
                return;
            }

            const updateData = {
                email: editInfo.email
            };

            if (editInfo.password) {
                updateData.new_password = editInfo.password;
            }

            const response = await fetch('http://localhost/mypage/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();

            if (data.success) {
                alertModal.openModal({
                    svg: '🔔',
                    msg1: "정보 수정 완료",
                    msg2: data.message,
                    showCancel: false,
                    onConfirm: () => {
                        setEditModalOpen(false);
                        // 수정된 정보로 상태 업데이트
                        setMemberData(prev => ({
                            ...prev,
                            email: editInfo.email
                        }));
                        // 사용자 정보 다시 가져오기
                        fetchUserInfo();
                    }
                });
            } else {
                alertModal.openModal({
                    svg: '❗',
                    msg1: "수정 실패",
                    msg2: data.message || "정보 수정에 실패했습니다.",
                    showCancel: false
                });
            }
        } catch (error) {
            console.error('정보 수정 오류:', error);
            alertModal.openModal({
                svg: '❗',
                msg1: "오류",
                msg2: "정보 수정 중 오류가 발생했습니다.",
                showCancel: false
            });
        }
    };

    // 로딩 중일 때
    if (isLoading) {
        return (
            <div>
                <Header/>
                <div className="wrap padding_60_0">
                    <div className="main_box flex flex_column align_center justify_center gap_20">
                        <h2 className="card_title font_700 mb_0">마이페이지</h2>
                        <div className="mypage_card_v2">
                            <div className="flex align_center justify_center" style={{height: '200px'}}>
                                <p>로딩 중...</p>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer/>
            </div>
        );
    }

    // 에러가 있을 때
    if (error) {
        return (
            <div>
                <Header/>
                <div className="wrap padding_60_0">
                    <div className="main_box flex flex_column align_center justify_center gap_20">
                        <h2 className="card_title font_700 mb_0">마이페이지</h2>
                        <div className="mypage_card_v2">
                            <div className="flex align_center justify_center" style={{height: '200px'}}>
                                <p>오류: {error}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer/>
            </div>
        );
    }

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
                                    src="/profile.png"
                                    alt="프로필"
                                    className="mypage_profile_img"
                                    onError={e => {
                                        e.currentTarget.src = "/profile/default_avatar.png";
                                    }}
                                />
                            </div>
                            <div className="mypage_profile_name">{memberData.name}</div>
                            <div className="mypage_profile_position">{memberData.dept_name} / {memberData.lv_name}</div>
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
                                        <span className="mypage_info_label">부서</span>
                                        <span className="mypage_info_value">{memberData.dept_name}</span>
                                    </div>
                                    <div>
                                        <span className="mypage_info_label">직급</span>
                                        <span className="mypage_info_value">{memberData.lv_name}</span>
                                    </div>
                                    <div>
                                        <span className="mypage_info_label">가입일</span>
                                        <span className="mypage_info_value">
                                          {memberData.hire_date ? memberData.hire_date.slice(0, 10) : ""}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mypage_section_v2">
                                <div className="mypage_title_v2">연차</div>
                                <div className="mypage_leave_grid">
                                    <div className="mypage_leave_item total">
                                        <span className="leave_title">총 연차</span>
                                        <b><CountUp duration={2.75} end={TOTAL_LEAVE} />일</b>
                                    </div>
                                    <div className="mypage_leave_item used">
                                        <span className="leave_title">사용</span>
                                        <b>
                                            <CountUp duration={2.75} end={usedLeave} />일
                                        </b>
                                    </div>
                                    <div className="mypage_leave_item remain">
                                        <span className="leave_title">남음</span>
                                        <b>
                                            <CountUp duration={2.75} end={remainLeave} />일
                                        </b>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className="board_btn" onClick={() => setPwModalOpen(true)}>정보수정</button>
                </div>
            </div>
            <Footer/>

            {/* 비밀번호 확인 모달 */}
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
                                        name="password"
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