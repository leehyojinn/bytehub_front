'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, {useState, useEffect} from "react";
import {useAlertModalStore} from "@/app/zustand/store";
import AlertModal from "../alertmodal/page";
import CountUp from 'react-countup';

// leaveedit에서 복사: 입사일 기준 총연차 계산 함수 (정책 기반)
function calcTotalLeave(hireDateStr, currentPolicy = null) {
  if (!hireDateStr) return 0;
  const hireDate = new Date(hireDateStr);
  const now = new Date();
  const policy = currentPolicy || {
    newEmpBase: 1,
    existingEmpBase: 15,
    annualIncrement: 1,
    maxAnnual: 25
  };
  const yearsWorked = now.getFullYear() - hireDate.getFullYear();
  const hasPassedAnniversary = now.getMonth() > hireDate.getMonth() ||
    (now.getMonth() === hireDate.getMonth() && now.getDate() >= hireDate.getDate());
  const actualYearsWorked = hasPassedAnniversary ? yearsWorked : yearsWorked - 1;
  if (actualYearsWorked < 1) {
    if (hireDate.getFullYear() !== now.getFullYear()) {
      const yearsSinceHire = now.getFullYear() - hireDate.getFullYear() - 1;
      return Math.min(
        policy.existingEmpBase + (yearsSinceHire * policy.annualIncrement),
        policy.maxAnnual
      );
    }
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    let monthsDiff = (yearEnd.getFullYear() - hireDate.getFullYear()) * 12 + (yearEnd.getMonth() - hireDate.getMonth());
    if (hireDate.getDate() > yearEnd.getDate()) {
      monthsDiff--;
    }
    return Math.max(0, policy.newEmpBase * monthsDiff);
  }
  return Math.min(
    policy.existingEmpBase + ((actualYearsWorked - 1) * policy.annualIncrement),
    policy.maxAnnual
  );
}

// leaveedit에서 복사: 연차 정책(leave rules) fetch 함수
async function fetchLeaveRules(apiUrl, token) {
  try {
    const response = await fetch(`${apiUrl}/leave/setting/all`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error(`서버 오류: ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.msg || '연차 규칙 조회에 실패했습니다.');
    return result.data.map(rule => ({
      id: rule.leaveSetIdx,
      year: rule.year,
      annual: rule.existingEmpBase,
      monthly: rule.newEmpBase,
      annualIncrement: rule.annualIncrement,
      maxAnnual: rule.maxAnnual,
      createdAt: new Date(rule.createdDate || Date.now()),
      originalData: rule
    }));
  } catch (err) {
    console.error('연차 규칙 조회 실패:', err);
    return [];
  }
}

// 연차 데이터는 state로 관리

export default function MyPage() {

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

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

    // 연차 정보 상태
    const [leaveInfo, setLeaveInfo] = useState({
        totalLeave: 0,
        usedLeave: 0,
        remainLeave: 0,
        isLoading: true
    });

    // leaveedit처럼 정책 상태 추가
    const [leaveRules, setLeaveRules] = useState([]);
    const [rulesLoading, setRulesLoading] = useState(true);

    // zustand alert modal
    const alertModal = useAlertModalStore();

    // 토큰 가져오기
    const getToken = () => {
        return sessionStorage.getItem('token');
    };

    // 컴포넌트 마운트 시 정책 먼저 불러오고, 사용자 정보/연차 정보 순차 로드
    useEffect(() => {
        const loadAll = async () => {
            setRulesLoading(true);
            const token = getToken();
            if (!token) {
                setRulesLoading(false);
                setIsLoading(false);
                setError('로그인이 필요합니다.');
                return;
            }
            const rules = await fetchLeaveRules(apiUrl, token);
            setLeaveRules(rules);
            setRulesLoading(false);
            await fetchUserInfo();
        };
        loadAll();
    }, []);

    // 사용자 정보가 로드된 후 연차 정보 가져오기
    useEffect(() => {
        if (memberData.hire_date) {
            fetchLeaveInfo();
        }
    }, [memberData.hire_date]);

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

            const response = await fetch(`${apiUrl}/mypage/info`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                }
            });

            const data = await response.json();

            if (data.success) {
                const userInfo = data.data;
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

    // 연차 정보 가져오기 (정책 기반으로만 동작, 불필요한 옛날 코드/주석 삭제)
    const fetchLeaveInfo = async () => {
        try {
            const token = getToken();
            if (!token) {
                setLeaveInfo(prev => ({ ...prev, isLoading: false }));
                return;
            }
            const response = await fetch(`${apiUrl}/leave/my`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                }
            });
            const data = await response.json();
            let remainDays = 0;
            if (data.success && data.data) {
                const leaveData = Array.isArray(data.data) ? data.data[0] : data.data;
                remainDays = leaveData?.remain_days || 0;
            }
            // 정책 기반 총연차 계산
            let totalDays = 15; // 정책이 없을 때 fallback
            if (memberData.hire_date && leaveRules.length > 0) {
                const currentYear = new Date().getFullYear();
                const currentRule = leaveRules.find(rule => rule.year === currentYear);
                const currentPolicy = currentRule ? {
                    newEmpBase: currentRule.originalData?.newEmpBase || 1,
                    existingEmpBase: currentRule.originalData?.existingEmpBase || 15,
                    annualIncrement: currentRule.originalData?.annualIncrement || 1,
                    maxAnnual: currentRule.originalData?.maxAnnual || 25
                } : null;
                totalDays = calcTotalLeave(memberData.hire_date, currentPolicy);
            }
            const usedDays = Math.max(0, totalDays - remainDays);
            setLeaveInfo({
                totalLeave: totalDays,
                usedLeave: usedDays,
                remainLeave: remainDays,
                isLoading: false
            });
        } catch (error) {
            setLeaveInfo({
                totalLeave: 15,
                usedLeave: 0,
                remainLeave: 15,
                isLoading: false
            });
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

            const response = await fetch(`${apiUrl}/mypage/verify-password`, {
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

            const response = await fetch(`${apiUrl}/mypage/update`, {
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
                                        <b>
                                            {leaveInfo.isLoading ? (
                                                <span>로딩...</span>
                                            ) : (
                                                <><CountUp duration={2.75} end={leaveInfo.totalLeave} />일</>
                                            )}
                                        </b>
                                    </div>
                                    <div className="mypage_leave_item used">
                                        <span className="leave_title">사용</span>
                                        <b>
                                            {leaveInfo.isLoading ? (
                                                <span>로딩...</span>
                                            ) : (
                                                <><CountUp duration={2.75} end={leaveInfo.usedLeave} />일</>
                                            )}
                                        </b>
                                    </div>
                                    <div className="mypage_leave_item remain">
                                        <span className="leave_title">남음</span>
                                        <b>
                                            {leaveInfo.isLoading ? (
                                                <span>로딩...</span>
                                            ) : (
                                                <><CountUp duration={2.75} end={leaveInfo.remainLeave} />일</>
                                            )}
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