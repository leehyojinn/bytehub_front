'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import React, {useState, useEffect, useRef} from "react";
import {useAlertModalStore} from "@/app/zustand/store";
import AlertModal from "../alertmodal/page";
import CountUp from 'react-countup';
import axios from "axios";

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
        hire_date: "",
        auth: [],
    });

    // 로딩 상태
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 모달 상태
    const [pwModalOpen, setPwModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [leaveDetailModalOpen, setLeaveDetailModalOpen] = useState(false);

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
    
    const [leaveDetails, setLeaveDetails] = useState([]);

    // leaveedit처럼 정책 상태 추가
    const [leaveRules, setLeaveRules] = useState([]);
    const [rulesLoading, setRulesLoading] = useState(true);

    // zustand alert modal
    const alertModal = useAlertModalStore();



    // 권한 가져오는거
    const authRef=useRef([]);
    const userIdRef=useRef('');
    const getAuth = async () => {
        let {data} = await axios.get(`${apiUrl}/auth/grant/${userIdRef.current}`);
        // console.log(data.auth_list);
        let palette = data.auth_list.map((item) => {
            return item.access_type;
        });
        const removeDup=(palette)=>{
            return [...new Set(palette)];
        }
        authRef.current = removeDup(palette);
    }
    useEffect(() => {
        fetchUserInfo().then(data => {
            getAuth().then(data => {
                authHTML();
            })
        })
    }, [userIdRef.current]);

    const auth_palette=[
        {access_type: 'board', content: '회의록 작성'},
        {access_type: 'chat', content: '채팅 채널 개설'},
        {access_type: 'project', content: '프로젝트 생성'},
        {access_type: 'leave', content: '연차 정보 확인'},
        {access_type: 'attendance', content: '근태 정보 확인'},
        {access_type: 'paeneol', content: '관리 패널 접근'},
    ];

    const authHTML =()=>{
        const list = auth_palette.map((item) => {
            if(authRef.current.includes(item.access_type)){
                // console.log('checked!');
                return item.content;
            };
        });
        const htmlList = (
            <ul className="auth-list">
                {list.map(item => {
                    if (item && item !== '') {
                        return (
                            <li className="auth-item" key={item}>
                                <div className="auth-title">{item}</div>
                            </li>
                        );
                    } else {
                        return null;
                    }
                })}
            </ul>
        );
        setShowAuth(htmlList);
    }
    const [showAuth, setShowAuth] = useState(null);



    // 토큰 가져오기
    const getToken = () => {
        return sessionStorage.getItem('token');
    };

        async function leaveDetail() {
        const token = getToken();
        console.log("연차 상세 내역 조회 시작 - 토큰:", token);
        
        // JWT 토큰에서 사용자 ID 추출
        let currentUserId = '';
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUserId = payload.id;
            console.log("JWT에서 추출한 사용자 ID:", currentUserId);
        } catch (error) {
            console.error("JWT 파싱 실패:", error);
        }
        
        try {
            let {data} = await axios.get(`${apiUrl}/leave/detail`,{
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                }
            });
            console.log("연차 상세 내역 응답:", data);
            if (data.success && Array.isArray(data.data)) {
                console.log("연차 상세 내역 데이터:", data.data);
                
                // 각 연차 데이터의 상세 정보 로그
                data.data.forEach((leave, index) => {
                    console.log(`연차 ${index + 1}:`, {
                        appr_idx: leave.appr_idx,
                        writer_id: leave.writer_id,
                        appr_date: leave.appr_date,
                        appr_type: leave.appr_type,
                        vac_start: leave.vac_start,
                        vac_end: leave.vac_end,
                        final_status: leave.final_status
                    });
                });
                
                // appr_idx 기준으로 중복 제거
                const uniqueLeaves = data.data.filter((leave, index, self) => 
                    index === self.findIndex(l => l.appr_idx === leave.appr_idx)
                );
                
                console.log("중복 제거 후 연차 데이터:", uniqueLeaves);
                setLeaveDetails(uniqueLeaves);
            } else {
                console.log("연차 상세 내역 데이터 없음");
                setLeaveDetails([]);
            }
        } catch (err) {
            console.error("연차 상세 내역 조회 실패:", err);
            setLeaveDetails([]);
        }
    }

    
    async function leaveMy() {
        const token = getToken();
        let {data} = await axios.get(`${apiUrl}/leave/my`,{
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });
        
        // console.log(data);
    }

    // 컴포넌트 마운트 시 사용자 정보 가져오기
    useEffect(() => {
        fetchUserInfo().then((res) => {
            // 사용자 정보 로드 완료 후 연차 상세 내역 조회
            leaveDetail();
            leaveMy();
        })
    }, []);

    // 사용자 정보가 로드된 후 연차 정책 가져오기
    useEffect(() => {
        if (memberData.hire_date) {
            // 연차 정책 가져오기
            const loadLeaveData = async () => {
                try {
                    const token = getToken();
                    if (token) {
                        const rules = await fetchLeaveRules(apiUrl, token);
                        setLeaveRules(rules);
                        setRulesLoading(false);
                    }
                } catch (error) {
                    console.error('연차 정책 로드 실패:', error);
                    setRulesLoading(false);
                }
            };
            
            loadLeaveData();
        }
    }, [memberData.hire_date]);

    // leaveRules가 로드된 후 연차 정보 가져오기
    useEffect(() => {
        if (memberData.hire_date && leaveRules.length > 0) {
            fetchLeaveInfo();
        }
    }, [memberData.hire_date, leaveRules]);

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
                userIdRef.current = userInfo.id || userInfo.user_id;
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

    // 연차 정보 가져오기 (leaveedit과 동일한 로직)
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
            
            console.log('연차 데이터 응답:', data); // 디버깅용
            
            // leaveedit과 동일한 로직: 연차 부여 안 했으면 0, 했으면 실제 값
            let remainDays = 0;
            let totalDays = 0;
            let usedDays = 0;
            
            if (data.success && data.data) {
                const leaveData = Array.isArray(data.data) ? data.data[0] : data.data;
                console.log('연차 데이터:', leaveData); // 디버깅용
                remainDays = leaveData?.remain_days ?? 0; // null, undefined 모두 0으로 처리
                console.log('잔여 연차:', remainDays); // 디버깅용
                
                // 연차 부여 전에는 총연차와 사용연차를 0으로 표시
                if (remainDays > 0) {
                    // 정책 기반 총연차 계산 (연차가 부여된 경우에만)
                    console.log('memberData.hire_date:', memberData.hire_date); // 디버깅용
                    console.log('leaveRules:', leaveRules); // 디버깅용
                    console.log('leaveRules.length:', leaveRules.length); // 디버깅용
                    
                    if (memberData.hire_date && leaveRules.length > 0) {
                        const currentYear = new Date().getFullYear();
                        const currentRule = leaveRules.find(rule => rule.year === currentYear);
                        console.log('currentRule:', currentRule); // 디버깅용
                        
                        const currentPolicy = currentRule ? {
                            newEmpBase: currentRule.originalData?.newEmpBase || 1,
                            existingEmpBase: currentRule.originalData?.existingEmpBase || 15,
                            annualIncrement: currentRule.originalData?.annualIncrement || 1,
                            maxAnnual: currentRule.originalData?.maxAnnual || 25
                        } : null;
                        console.log('currentPolicy:', currentPolicy); // 디버깅용
                        
                        totalDays = calcTotalLeave(memberData.hire_date, currentPolicy);
                        console.log('총 연차:', totalDays); // 디버깅용
                    } else {
                        console.log('조건 불충족: hire_date 또는 leaveRules 없음'); // 디버깅용
                    }
                    
                    usedDays = Math.max(0, totalDays - remainDays);
                    console.log('사용 연차:', usedDays); // 디버깅용
                } else {
                    console.log('연차 부여 전: 총연차와 사용연차를 0으로 설정'); // 디버깅용
                    totalDays = 0;
                    usedDays = 0;
                }
            }
            
            setLeaveInfo({
                totalLeave: totalDays,
                usedLeave: usedDays,
                remainLeave: remainDays,
                isLoading: false
            });
        } catch (error) {
            console.error('연차 정보 가져오기 실패:', error); // 디버깅용
            setLeaveInfo({
                totalLeave: 0,
                usedLeave: 0,
                remainLeave: 0,
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
                            <div>{showAuth}</div>
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
                                <div className="mypage_title_v2 flex aling_center justify_between">
                                    <p>연차</p>
                                    <p style={{cursor: 'pointer', textDecoration: 'underline'}} onClick={() => setLeaveDetailModalOpen(true)}>상세보기</p> 
                                </div>
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

            {/* 연차 상세내역 모달 */}
            {
                leaveDetailModalOpen && (
                    <div className="modal_overlay" onClick={() => setLeaveDetailModalOpen(false)}>
                        <div className="modal_content" style={{width: "800px"}} onClick={e => e.stopPropagation()}>
                            <h3 className="card_title font_700 mb_20">연차 상세 내역</h3>
                            <div style={{maxHeight: '600px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '8px'}}>
                                <table className="board_table" style={{margin: 0, width: '100%'}}>
                                    <thead>
                                        <tr>
                                            <th style={{width: '15%'}}>신청일</th>
                                            <th style={{width: '15%'}}>연차 종류</th>
                                            <th style={{width: '20%'}}>시작일</th>
                                            <th style={{width: '20%'}}>종료일</th>
                                            <th style={{width: '15%'}}>사용일수</th>
                                            <th style={{width: '15%'}}>상태</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            // JWT 토큰에서 사용자 ID 추출
                                            let currentUserId = '';
                                            try {
                                                const token = getToken();
                                                const payload = JSON.parse(atob(token.split('.')[1]));
                                                currentUserId = payload.id;
                                            } catch (error) {
                                                console.error("JWT 파싱 실패:", error);
                                            }
                                            
                                            // 현재 사용자의 연차 데이터만 필터링
                                            const filteredLeaves = leaveDetails.filter(leave => leave.writer_id === currentUserId);
                                            
                                            console.log("모달에서 필터링된 연차 데이터:", filteredLeaves);
                                            filteredLeaves.forEach((leave, index) => {
                                                console.log(`모달 연차 ${index + 1}:`, {
                                                    appr_idx: leave.appr_idx,
                                                    writer_id: leave.writer_id,
                                                    appr_date: leave.appr_date,
                                                    appr_type: leave.appr_type,
                                                    vac_start: leave.vac_start,
                                                    vac_end: leave.vac_end,
                                                    final_status: leave.final_status
                                                });
                                            });
                                            
                                            return filteredLeaves.length > 0 ? filteredLeaves
                                            .map((leave, index) => {
                                            // 사용일수 계산
                                            let usedDays = 0;
                                            if (leave.vac_start && leave.vac_end) {
                                                const startDate = new Date(leave.vac_start);
                                                const endDate = new Date(leave.vac_end);
                                                usedDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                                            }
                                            
                                            return (
                                                <tr key={index}>
                                                    <td>{leave.appr_date ? new Date(leave.appr_date).toLocaleDateString() : '-'}</td>
                                                    <td>{leave.appr_type || '-'}</td>
                                                    <td>{leave.vac_start ? new Date(leave.vac_start).toLocaleDateString() : '-'}</td>
                                                    <td>{leave.vac_end ? new Date(leave.vac_end).toLocaleDateString() : '-'}</td>
                                                    <td>{usedDays > 0 ? `${usedDays}일` : '-'}</td>
                                                    <td>
                                                        {leave.final_status === '승인완료' ? '승인' : 
                                                         leave.final_status === '반려' ? '반려' : 
                                                         leave.final_status === '대기중' ? '대기' : 
                                                         leave.final_status || '대기'}
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan="6" style={{textAlign: 'center'}}>연차 사용 내역이 없습니다.</td>
                                            </tr>
                                        );
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                            <div className="modal_buttons" style={{marginTop: '20px'}}>
                                <button
                                    type="button"
                                    className="board_btn"
                                    onClick={() => setLeaveDetailModalOpen(false)}>닫기</button>
                            </div>
                        </div>
                    </div>
                )
            }

            <AlertModal/>
        </div>
    );
}