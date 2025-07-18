'use client';

import React, { useState, useEffect } from "react";
import Header from "@/app/Header";
import Footer from "@/app/Footer";

// API 서버 주소
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const initialPolicy = {
  year: 2025,
  annual: 15,
  monthly: 12,
  sick: 15,
  annualStartMonth: 1,
  sickStartMonth: 1,
  monthlyStartMonth: 1,
};

// 입사일 기준 총연차 계산 함수 (백엔드 로직과 동일)
function calcTotalLeave(hireDateStr, currentPolicy = null) {
  if (!hireDateStr) return 0;
  
  const hireDate = new Date(hireDateStr);
  const now = new Date();
  
  // 기본 정책 값 (정책이 없는 경우)
  const policy = currentPolicy || {
    newEmpBase: 1,
    existingEmpBase: 15,
    annualIncrement: 1,
    maxAnnual: 25
  };
  
  // 근속년수 계산 (백엔드와 동일: TIMESTAMPDIFF(YEAR, hire_date, CURDATE()))
  const yearsWorked = now.getFullYear() - hireDate.getFullYear();
  const hasPassedAnniversary = now.getMonth() > hireDate.getMonth() || 
    (now.getMonth() === hireDate.getMonth() && now.getDate() >= hireDate.getDate());
  
  const actualYearsWorked = hasPassedAnniversary ? yearsWorked : yearsWorked - 1;
  
  // 1년 미만 신규입사자: 백엔드 조건과 동일하게 처리
  if (actualYearsWorked < 1) {
    // 백엔드 조건: 올해 입사한 사람만 (YEAR(hire_date) = YEAR(CURDATE()))
    if (hireDate.getFullYear() !== now.getFullYear()) {
      // 작년 이전 입사자는 기존 사원으로 처리
      const yearsSinceHire = now.getFullYear() - hireDate.getFullYear() - 1;
      return Math.min(
        policy.existingEmpBase + (yearsSinceHire * policy.annualIncrement),
        policy.maxAnnual
      );
    }
    
    // 입사일부터 올해 12월 31일까지의 월 차이 (백엔드 TIMESTAMPDIFF 로직과 동일)
    const yearEnd = new Date(now.getFullYear(), 11, 31); // 올해 12월 31일
    
    // MySQL TIMESTAMPDIFF(MONTH, start, end) 로직 구현
    let monthsDiff = (yearEnd.getFullYear() - hireDate.getFullYear()) * 12 + (yearEnd.getMonth() - hireDate.getMonth());
    
    // 일자 고려: 시작일의 일자가 종료일의 일자보다 크면 -1
    if (hireDate.getDate() > yearEnd.getDate()) {
      monthsDiff--;
    }
    
    // 백엔드와 동일: newEmpBase * 월수
    return Math.max(0, policy.newEmpBase * monthsDiff);
  }
  
  // 1년 이상 기존 사원: existingEmpBase + (근속년수 - 1) * annualIncrement (최대 maxAnnual까지)
  return Math.min(
    policy.existingEmpBase + ((actualYearsWorked - 1) * policy.annualIncrement),
    policy.maxAnnual
  );
}

export default function VacationEditPage() {
  const [policy, setPolicy] = useState(initialPolicy);
  // 사원별 연/월차 현황할거임
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editPolicy, setEditPolicy] = useState(false);
  const [search, setSearch] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
 
  // 연차 부여
  const [grantLeaveModal, setGrantLeaveModal] = useState(false);
  
  // 체크박스 관련 상태
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // 페이징 관련 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // 페이지당 표시할 사원 수
  
  // 연차 발생 규칙 관련 상태
  const [leaveRules, setLeaveRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    year: new Date().getFullYear(),
    newEmpBase: 1,
    existingEmpBase: 15,
    annualIncrement: 1,
    maxAnnual: 25
  });

  // API에서 직원 연차 데이터 가져오기
  const fetchMembersLeaveData = async (rulesData = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      console.log('API 호출:', `${apiUrl}/leave/all`);
      console.log('토큰:', token);

      const response = await fetch(`${apiUrl}/leave/all`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      console.log('응답 상태:', response.status);

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }

      const result = await response.json();
      console.log('응답 데이터:', result);

      // 백엔드 응답 구조: { success: true, data: [...] }
      if (!result.success) {
        throw new Error(result.msg || '데이터 조회에 실패했습니다.');
      }

      console.log('백엔드 원본 데이터:', result.data);
      console.log('데이터 개수:', result.data.length);

      // 중복 사용자 제거를 위한 Map 사용
      const memberMap = new Map();

      result.data.forEach(member => {
        const userId = member.mem_idx || member.user_id;
        if (!memberMap.has(userId)) {
          memberMap.set(userId, member);
        } else {
          console.warn('중복 사용자 발견:', userId, member);
        }
      });

      console.log('중복 제거 후 사용자 수:', memberMap.size);

      // 현재 연차 정책 가져오기 (매개변수로 받은 규칙 또는 기존 상태 사용)
      const rules = rulesData || leaveRules;
      const currentYear = new Date().getFullYear();
      const currentRule = rules.find(rule => rule.year === currentYear);
      const currentPolicy = currentRule ? {
        newEmpBase: currentRule.originalData?.newEmpBase || 1,
        existingEmpBase: currentRule.originalData?.existingEmpBase || 15,
        annualIncrement: currentRule.originalData?.annualIncrement || 1,
        maxAnnual: currentRule.originalData?.maxAnnual || 25
      } : null;

      console.log('현재 적용 정책:', currentPolicy);

      // API 응답 데이터를 기존 컴포넌트 구조에 맞게 변환
      const transformedMembers = Array.from(memberMap.values()).map(member => {
        const remainDays = member.remain_days ?? 0; // null, undefined 모두 0으로 처리
        const joinDate = member.hire_date ? member.hire_date.split('T')[0] : '';
        const totalLeave = calcTotalLeave(joinDate, currentPolicy); // 정책 기반 총연차 계산
        const usedLeave = Math.max(0, totalLeave - remainDays); // 사용연차 = 총연차 - 잔여연차
        const userId = member.mem_idx || member.user_id;
        
        return {
          id: userId,
          name: member.name || '',
          dept_name: member.dept_name || '미배정',
          level_name: member.level_name || '미배정',
          email: member.email || '',
          join_date: joinDate, 
          total_leave: totalLeave,        // 정책 기반 계산된 총연차
          used_leave: usedLeave,          // 총연차 - 잔여연차  
          remain_days: remainDays,        // 백엔드에서 가져온 잔여연차
          // 기존 구조 호환을 위한 필드들
          annual_used: usedLeave,
          monthly_used: 0,
          sick_used: 0
        };
      });

      console.log('변환된 사용자 데이터:', transformedMembers);
      console.log('변환된 사용자 ID 목록:', transformedMembers.map(m => m.id));

      setMembers(transformedMembers);
    } catch (err) {
      console.error('연차 데이터 조회 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 백엔드에서 연차 규칙 리스트 가져오기
  const fetchLeaveRules = async () => {
    try {
      setRulesLoading(true);
      setRulesError(null);
      
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      console.log('연차 규칙 API 호출:', `${apiUrl}/leave/setting/all`);

      const response = await fetch(`${apiUrl}/leave/setting/all`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      console.log('연차 규칙 응답 상태:', response.status);

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }

      const result = await response.json();
      console.log('연차 규칙 응답 데이터:', result);

      if (!result.success) {
        throw new Error(result.msg || '연차 규칙 조회에 실패했습니다.');
      }

      // 백엔드 데이터를 프론트엔드 형식에 맞게 변환
      const transformedRules = result.data.map(rule => ({
        id: rule.leaveSetIdx,
        year: rule.year,
        annual: rule.existingEmpBase,      // 기존직원 기본연차를 연차로 표시
        monthly: rule.newEmpBase,          // 신규직원 월당연차를 월차로 표시
        annualStartDate: '1월 1일',        // 기본값
        monthlyStartDate: '매월 만근시 1일', // 기본값
        note: `기본 ${rule.existingEmpBase}일 + 근속년수당 ${rule.annualIncrement}일 (최대 ${rule.maxAnnual}일)`,
        createdAt: new Date(rule.createdDate || Date.now()),
        // 원본 데이터도 보관
        originalData: rule
      }));

      setLeaveRules(transformedRules);
      return transformedRules; // 변환된 규칙 데이터 반환
    } catch (err) {
      console.error('연차 규칙 조회 실패:', err);
      setRulesError(err.message);
      return []; // 오류 시 빈 배열 반환
    } finally {
      setRulesLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드 (순차 실행)
  useEffect(() => {
    const loadData = async () => {
      const rulesData = await fetchLeaveRules(); // 먼저 정책을 로드
      await fetchMembersLeaveData(rulesData); // 정책 데이터를 전달하여 사원 데이터 로드
    };
    loadData();
  }, []);

  // 정책 저장
  const handlePolicySave = (e) => {
    e.preventDefault();
    setPolicy(prev => ({
      ...prev,
      annual: Number(policy.annual),
      monthly: Number(policy.monthly),
      sick: Number(policy.sick),
      annualStartMonth: Number(policy.annualStartMonth),
      sickStartMonth: Number(policy.sickStartMonth),
      monthlyStartMonth: Number(policy.monthlyStartMonth),
    }));
    setEditPolicy(false);
  };

  // 연차 규칙 저장 (백엔드 API 호출)
  const handleRuleSave = async (e) => {
    e.preventDefault();
    
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      console.log('연차 규칙 저장 API 호출:', ruleForm);

      const response = await fetch(`${apiUrl}/leave/setting`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          year: parseInt(ruleForm.year),
          newEmpBase: parseInt(ruleForm.newEmpBase),
          existingEmpBase: parseInt(ruleForm.existingEmpBase),
          annualIncrement: parseInt(ruleForm.annualIncrement),
          maxAnnual: parseInt(ruleForm.maxAnnual)
        })
      });

      console.log('연차 규칙 저장 응답 상태:', response.status);

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }

      const result = await response.json();
      console.log('연차 규칙 저장 응답:', result);

      if (!result.success) {
        throw new Error(result.msg || '연차 규칙 저장에 실패했습니다.');
      }

      // 성공하면 리스트 새로고침하고 사원 데이터도 업데이트
      const updatedRulesData = await fetchLeaveRules();
      await fetchMembersLeaveData(updatedRulesData);
      
      // 폼 초기화
      setRuleForm({
        year: new Date().getFullYear(),
        newEmpBase: 1,
        existingEmpBase: 15,
        annualIncrement: 1,
        maxAnnual: 25
      });
      
      setEditPolicy(false);
      alert('연차 규칙이 저장되었습니다.');
      
    } catch (err) {
      console.error('연차 규칙 저장 실패:', err);
      alert(`연차 규칙 저장 실패: ${err.message}`);
    }
  };

  // 최신 년도 규칙 가져오기 (년도가 같으면 가장 최신값)
  const getLatestRuleByYear = (year) => {
    const rulesForYear = leaveRules.filter(rule => rule.year === year);
    if (rulesForYear.length === 0) return null;
    
    // 같은 년도의 규칙들 중 가장 최신 것 반환
    return rulesForYear.reduce((latest, current) => 
      new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
    );
  };

  // 표시할 규칙들 (년도 내림차순 정렬)
  const displayRules = leaveRules.sort((a, b) => b.year - a.year);

  // API 연동으로 인해 더 이상 사용하지 않는 함수
  // const handleUse = (id, type) => { ... };

  // 연차/월차/병가 직접 수정 모달
  const openEditModal = (m) => {
    setEditMember({ ...m });
    setEditModal(true);
  };

  // 연차 부여 모달 열기
  const openGrantLeaveModal = () => {
    setGrantLeaveModal(true);
  };

  // 연차 부여 처리
  const handleGrantLeave = async (e) => {
    e.preventDefault();
    
    if (selectedMembers.length === 0) {
      alert("연차를 부여할 사원을 선택해주세요.");
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      console.log('정책 기반 연차 생성 API 호출:', selectedMembers);

      const response = await fetch(`${apiUrl}/leave/generate`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selectedMembers: selectedMembers
        })
      });

      console.log('연차 생성 응답 상태:', response.status);

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }

      const result = await response.json();
      console.log('연차 생성 응답:', result);

      if (!result.success) {
        throw new Error(result.msg || '연차 생성에 실패했습니다.');
      }

      // 성공하면 데이터 새로고침 (현재 정책과 함께)
      await fetchMembersLeaveData(leaveRules);
      
      alert(`선택된 ${selectedMembers.length}명의 사원에게 정책에 따라 연차가 생성되었습니다.`);
      
    } catch (err) {
      console.error('연차 생성 실패:', err);
      alert(`연차 생성 실패: ${err.message}`);
    }
    
    // 선택 해제 및 모달 닫기
    setSelectedMembers([]);
    setSelectAll(false);
    setGrantLeaveModal(false);
  };

  // 개별 체크박스 토글
  const handleMemberCheck = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        const newSelected = prev.filter(id => id !== memberId);
        setSelectAll(false);
        return newSelected;
      } else {
        const newSelected = [...prev, memberId];
        const filtered = members.filter(m => 
          m.id.includes(search) || m.name.includes(search)
        );
        setSelectAll(newSelected.length === filtered.length);
        return newSelected;
      }
    });
  };

  // 전체 선택 토글 (현재 페이지만)
  const handleSelectAll = () => {
    if (selectAll) {
      // 현재 페이지의 선택 해제
      const currentPageIds = currentPageMembers.map(m => m.id);
      setSelectedMembers(prev => prev.filter(id => !currentPageIds.includes(id)));
      setSelectAll(false);
    } else {
      // 현재 페이지의 모든 멤버 선택
      const currentPageIds = currentPageMembers.map(m => m.id);
      setSelectedMembers(prev => [...new Set([...prev, ...currentPageIds])]);
      setSelectAll(true);
    }
  };

  // 선택된 사원들에게 연차 부여
  const openGrantLeaveModalForSelected = () => {
    if (selectedMembers.length === 0) {
      alert("연차를 부여할 사원을 선택해주세요.");
      return;
    }
    
    setGrantLeaveModal(true);
  };
  const handleEditSave = async (e) => {
    e.preventDefault();
    
    try {
      // TODO: 백엔드에 연차 수정 API 구현 필요
      // const response = await fetch(`${apiUrl}/leave/update`, { ... });
      
      // 현재는 로컬 상태만 업데이트
      setMembers(prev =>
          prev.map(m => m.id === editMember.id ? { ...editMember } : m)
      );
      
      alert("연차 정보가 수정되었습니다.");
      setEditModal(false);
    } catch (error) {
      console.error("연차 수정 실패:", error);
      alert("연차 수정에 실패했습니다.");
    }
  };

  // 검색 필터
  const filtered = members.filter(m =>
      (m.id.includes(search)) || 
      m.name.includes(search) || 
      m.dept_name && m.dept_name.includes(search) ||
      (m.level_name && m.level_name.includes(search))
  );

  // 페이징 계산
  const totalPages = Math.ceil(filtered.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageMembers = filtered.slice(startIndex, endIndex);

  // 페이지 변경 함수
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  // 검색어 변경 시 첫 페이지로 리셋
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  // 현재 페이지의 전체 선택 상태 업데이트
  useEffect(() => {
    if (currentPageMembers.length > 0) {
      const allCurrentPageSelected = currentPageMembers.every(m => selectedMembers.includes(m.id));
      setSelectAll(allCurrentPageSelected);
    } else {
      setSelectAll(false);
    }
  }, [currentPageMembers, selectedMembers]);

  return (
      <div>
        <Header />
        <div className="wrap padding_60_0">
          <div className="main_box flex_1 vacation_policy_box">
            <div className="card_title font_700 mb_20">연차 발생 규칙 관리</div>
            <div className="flex justify_between align_center mb_20">
              <div></div>
              <button className="board_btn" onClick={() => setEditPolicy(true)}>규칙 추가</button>
            </div>
            <table className="vacation_policy_table">
              <thead>
              <tr>
                <th>년도</th>
                <th>연차(개)</th>
                <th>월차(개)</th>
                <th>연차 부여 기준일</th>
                <th>월차 부여 기준일</th>
                <th>비고</th>
              </tr>
              </thead>
              <tbody>
              {rulesLoading && (
                <tr>
                  <td colSpan={6} style={{textAlign: 'center', color: '#aaa'}}>연차 규칙을 불러오는 중입니다...</td>
                </tr>
              )}
              {rulesError && (
                <tr>
                  <td colSpan={6} style={{textAlign: 'center', color: 'red'}}>{rulesError}</td>
                </tr>
              )}
              {!rulesLoading && !rulesError && displayRules.length === 0 && (
                <tr>
                  <td colSpan={6} style={{textAlign: 'center', color: '#aaa'}}>등록된 규칙이 없습니다.</td>
                </tr>
              )}
              {!rulesLoading && !rulesError && displayRules.length > 0 && (
                displayRules.map(rule => (
                  <tr key={rule.id}>
                    <td>{rule.year}</td>
                    <td>{rule.annual}</td>
                    <td>{rule.monthly}</td>
                    <td>{rule.annualStartDate}</td>
                    <td>{rule.monthlyStartDate}</td>
                    <td>{rule.note}</td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
            <div className="card_title font_700 mt_30 mb_20">사원별 연차/월차 현황</div>
            <div className="flex justify_between align_center mb_20">
              <form onSubmit={e => e.preventDefault()} className="flex gap_10">
                <input
                    className="board_write_input"
                    style={{width: 220}}
                    placeholder="이름 및 부서 검색"
                    value={search}
                    onChange={handleSearchChange}
                />
              </form>
              <button className="board_btn" onClick={openGrantLeaveModalForSelected}>연차 부여</button>
            </div>
            <table className="vacation_member_table">
              <thead>
              <tr>
                <th>
                  <label className="my_checkbox_label" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 0}}>
                    <input
                      type="checkbox"
                      className="my_checkbox_input"
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                    <span className="my_checkbox_box"></span>
                  </label>
                </th>
                <th>이름</th>
                <th>부서</th>
                <th>직급</th>
                <th>입사일</th>
                <th>총 연차</th>
                <th>사용 연차</th>
                <th>잔여 연차</th>
                {/* <th>수정</th> */}
              </tr>
              </thead>
              <tbody>
              {loading && <tr><td colSpan={8} style={{textAlign: 'center', color: '#aaa'}}>데이터를 불러오는 중입니다...</td></tr>}
              {error && <tr><td colSpan={8} style={{textAlign: 'center', color: 'red'}}>{error}</td></tr>}
              {filtered.length === 0 && !loading && !error && (
                  <tr>
                    <td colSpan={8} style={{textAlign: 'center', color: '#aaa'}}>검색 결과가 없습니다.</td>
                  </tr>
              )}
              {currentPageMembers.map(m => {
                return (
                    <tr key={m.id}>
                      <td>
                        <label className="my_checkbox_label" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 0}}>
                          <input
                            type="checkbox"
                            className="my_checkbox_input"
                            checked={selectedMembers.includes(m.id)}
                            onChange={() => handleMemberCheck(m.id)}
                          />
                          <span className="my_checkbox_box"></span>
                        </label>
                      </td>
                      <td>{m.name}</td>
                      <td>{m.dept_name || '-'}</td>
                      <td>{m.level_name || '-'}</td>
                      <td>{m.join_date}</td>
                      <td><b>{m.total_leave}</b></td>
                      <td><b>{m.used_leave}</b></td>
                      <td><b style={{color: '#f44336'}}>{m.remain_days}</b></td>
                      {/* <td>
                        <button className="board_btn board_btn_small" onClick={() => openEditModal(m)}>직접수정</button>
                      </td> */}
                    </tr>
                );
              })}
              </tbody>
            </table>
            
            {/* 페이징 정보 및 UI */}
            {filtered.length > 0 && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                  전체 {filtered.length}명 중 {startIndex + 1}-{Math.min(endIndex, filtered.length)}명 표시
                  {selectedMembers.length > 0 && ` | 선택된 사원: ${selectedMembers.length}명`}
                </div>
                {totalPages > 1 && (
                  <div className="board_pagination">
                    <button
                      className="board_btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      이전
                    </button>
                    {[...Array(totalPages)].map((_, idx) => (
                      <button
                        key={idx + 1}
                        className={`board_btn board_page_btn${currentPage === idx + 1 ? " active" : ""}`}
                        onClick={() => handlePageChange(idx + 1)}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      className="board_btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      다음
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 연차 규칙 추가/수정 모달 */}
          {editPolicy && (
              <div className="modal_overlay" onClick={() => setEditPolicy(false)}>
                <div className="modal_content" onClick={e => e.stopPropagation()}>
                  <h3 className="card_title font_700 mb_20">연차 정책 설정</h3>
                  <form onSubmit={handleRuleSave} className="flex flex_column gap_10">
                    <div className="board_write_row">
                      <label className="board_write_label">년도</label>
                      <input
                          type="number"
                          className="board_write_input"
                          value={ruleForm.year}
                          min={2020}
                          max={2030}
                          onChange={e => setRuleForm(prev => ({ ...prev, year: e.target.value }))}
                      />
                    </div>
                    <div className="board_write_row">
                      <label className="board_write_label">신규직원 월당 연차(개)</label>
                      <input
                          type="number"
                          className="board_write_input"
                          value={ruleForm.newEmpBase}
                          min={0}
                          max={12}
                          onChange={e => setRuleForm(prev => ({ ...prev, newEmpBase: e.target.value }))}
                      />
                      <small style={{color: '#666', fontSize: '12px'}}>
                        입사 1년 미만 신규직원이 매월 받는 연차 일수
                      </small>
                    </div>
                    <div className="board_write_row">
                      <label className="board_write_label">기존직원 기본 연차(개)</label>
                      <input
                          type="number"
                          className="board_write_input"
                          value={ruleForm.existingEmpBase}
                          min={0}
                          max={30}
                          onChange={e => setRuleForm(prev => ({ ...prev, existingEmpBase: e.target.value }))}
                      />
                      <small style={{color: '#666', fontSize: '12px'}}>
                        근속 1년 이상 직원의 기본 연차 일수
                      </small>
                    </div>
                    <div className="board_write_row">
                      <label className="board_write_label">근속년수당 추가 연차(개)</label>
                      <input
                          type="number"
                          className="board_write_input"
                          value={ruleForm.annualIncrement}
                          min={0}
                          max={5}
                          onChange={e => setRuleForm(prev => ({ ...prev, annualIncrement: e.target.value }))}
                      />
                      <small style={{color: '#666', fontSize: '12px'}}>
                        근속년수 1년마다 추가되는 연차 일수
                      </small>
                    </div>
                    <div className="board_write_row">
                      <label className="board_write_label">최대 연차 한도(개)</label>
                      <input
                          type="number"
                          className="board_write_input"
                          value={ruleForm.maxAnnual}
                          min={15}
                          max={50}
                          onChange={e => setRuleForm(prev => ({ ...prev, maxAnnual: e.target.value }))}
                      />
                      <small style={{color: '#666', fontSize: '12px'}}>
                        연차 누적의 최대 한도 (무제한 증가 방지)
                      </small>
                    </div>
                    <div className="modal_buttons">
                      <button type="submit" className="board_btn">저장</button>
                      <button type="button" className="board_btn board_btn_cancel" onClick={() => setEditPolicy(false)}>취소</button>
                    </div>
                  </form>
                </div>
              </div>
          )}

          {/* 연차 직접 수정 모달 */}
          {editModal && (
              <div className="modal_overlay" onClick={() => setEditModal(false)}>
                <div className="modal_content" onClick={e => e.stopPropagation()}>
                  <h3 className="card_title font_700 mb_20">연차 직접 수정</h3>
                  <form onSubmit={handleEditSave} className="flex flex_column gap_10">
                    <div className="board_write_row">
                      <label className="board_write_label">사원명</label>
                      <input
                          type="text"
                          className="board_write_input"
                          value={editMember.name}
                          disabled
                          style={{backgroundColor: '#f5f5f5'}}
                      />
                    </div>
                    <div className="board_write_row">
                      <label className="board_write_label">부서/직급</label>
                      <input
                          type="text"
                          className="board_write_input"
                          value={`${editMember.dept_name || '-'} / ${editMember.level_name || '-'}`}
                          disabled
                          style={{backgroundColor: '#f5f5f5'}}
                      />
                    </div>
                    <div className="board_write_row">
                      <label className="board_write_label">총 연차</label>
                      <input
                          type="number"
                          className="board_write_input"
                          value={editMember.total_leave}
                          min={0}
                          max={30}
                          onChange={e => setEditMember(m => ({ ...m, total_leave: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="board_write_row">
                      <label className="board_write_label">사용 연차</label>
                      <input
                          type="number"
                          className="board_write_input"
                          value={editMember.used_leave}
                          min={0}
                          max={editMember.total_leave || 0}
                          onChange={e => setEditMember(m => ({ 
                            ...m, 
                            used_leave: Number(e.target.value),
                            remain_days: m.total_leave - Number(e.target.value),
                            annual_used: Number(e.target.value) // 호환성을 위해 유지
                          }))}
                      />
                    </div>
                    <div className="board_write_row">
                      <label className="board_write_label">잔여 연차</label>
                      <input
                          type="text"
                          className="board_write_input"
                          value={editMember.remain_days}
                          disabled
                          style={{backgroundColor: '#f5f5f5'}}
                      />
                    </div>
                    <div className="modal_buttons">
                      <button type="submit" className="board_btn">저장</button>
                      <button type="button" className="board_btn board_btn_cancel" onClick={() => setEditModal(false)}>취소</button>
                    </div>
                  </form>
                </div>
              </div>
          )}

          {/* 연차 부여 모달 */}
          {grantLeaveModal && (
              <div className="modal_overlay" onClick={() => setGrantLeaveModal(false)}>
                <div className="modal_content" onClick={e => e.stopPropagation()}>
                  <h3 className="card_title font_700 mb_20">연차 생성</h3>
                  <form onSubmit={handleGrantLeave} className="flex flex_column gap_10">
                    <div className="board_write_row">
                      <label className="board_write_label">선택된 사원 ({selectedMembers.length}명)</label>
                      <div className="board_write_input" style={{height: 'auto', minHeight: '40px', padding: '8px'}}>
                        {selectedMembers.length === 0 ? (
                          <span style={{color: '#999'}}>선택된 사원이 없습니다.</span>
                        ) : (
                          selectedMembers.map(memberId => {
                            const member = members.find(m => m.id === memberId);
                            return member ? (
                              <span key={memberId} style={{
                                display: 'inline-block',
                                background: '#e3f2fd',
                                padding: '2px 8px',
                                margin: '2px',
                                borderRadius: '4px',
                                fontSize: '14px'
                              }}>
                                {member.name} ({member.id})
                              </span>
                            ) : null;
                          })
                        )}
                      </div>
                    </div>
                    
                    <div className="board_write_row">
                      <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '5px', fontSize: '14px'}}>
                        <strong>📋 연차 생성 정책 (자동 적용):</strong><br/><br/>
                        
                        <div style={{background: '#e3f2fd', padding: '10px', borderRadius: '4px', marginBottom: '15px'}}>
                          <strong style={{color: '#1976d2'}}>🗓️ 적용 정책: {new Date().getFullYear()}년도 규칙</strong><br/>
                          <span style={{fontSize: '12px', color: '#666'}}>
                            ※ 연차 생성은 항상 <strong>현재 년도({new Date().getFullYear()}년)</strong>의 정책을 사용합니다.
                          </span>
                        </div>
                        
                        <div style={{marginBottom: '10px'}}>
                          <strong style={{color: '#2196F3'}}>🆕 신규 입사자 (1년 미만):</strong><br/>
                          • 입사월부터 연말까지 월별 연차 생성<br/>
                          • 월당 연차: <strong>{getLatestRuleByYear(new Date().getFullYear())?.monthly || 1}일</strong><br/>
                        </div>
                        
                        <div style={{marginBottom: '10px'}}>
                          <strong style={{color: '#4CAF50'}}>👤 기존 사원 (1년 이상):</strong><br/>
                          • 기본 연차: <strong>{getLatestRuleByYear(new Date().getFullYear())?.annual || 15}일</strong><br/>
                          • 근속년수당 추가: <strong>+{getLatestRuleByYear(new Date().getFullYear())?.originalData?.annualIncrement || 1}일/년</strong><br/>
                          • 최대 한도: <strong>{getLatestRuleByYear(new Date().getFullYear())?.originalData?.maxAnnual || 25}일</strong><br/>
                        </div>
                        
                        {(() => {
                          const nextYear = new Date().getFullYear() + 1;
                          const nextYearRule = getLatestRuleByYear(nextYear);
                          if (nextYearRule) {
                            return (
                              <div style={{color: '#ff9800', fontSize: '12px', marginTop: '10px', padding: '8px', background: '#fff3e0', borderRadius: '4px'}}>
                                ⚠️ <strong>{nextYear}년 정책이 등록되어 있습니다.</strong><br/>
                                → {nextYear}년 1월 1일부터 새로운 정책이 자동 적용됩니다.
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        <div style={{color: '#ff5722', fontSize: '12px', marginTop: '10px'}}>
                          ※ 각 사원의 입사일과 근속년수에 따라 자동 계산됩니다.
                        </div>
                      </div>
                    </div>
                    <div className="modal_buttons">
                      <button type="submit" className="board_btn">연차 생성</button>
                      <button type="button" className="board_btn board_btn_cancel" onClick={() => setGrantLeaveModal(false)}>취소</button>
                    </div>
                  </form>
                </div>
              </div>
          )}

        </div>
        <Footer />
      </div>
  );
}
