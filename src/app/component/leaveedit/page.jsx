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

// API에서 연차 정보를 직접 계산해서 전달하므로 아래 함수들은 사용하지 않음
// function calcAnnualTotal(join_date, now = new Date(), base = 15) { ... }
// function calcMonthlyTotal(join_date, now = new Date(), base = 12) { ... }
// function calcSickTotal(policy) { ... }

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
  const [grantLeaveForm, setGrantLeaveForm] = useState({
    targetMember: "",
    amount: 1,
    reason: ""
  });
  
  // 체크박스 관련 상태
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // API에서 직원 연차 데이터 가져오기
  const fetchMembersLeaveData = async () => {
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

      // API 응답 데이터를 기존 컴포넌트 구조에 맞게 변환
      const transformedMembers = result.data.map(member => ({
        id: member.mem_idx,
        name: member.name,
        dept_name: member.dept_name,
        level_name: member.level_name,
        email: member.email,
        join_date: member.hire_date ? member.hire_date.split('T')[0] : '', // ISO 날짜를 YYYY-MM-DD 형식으로 변환
        total_leave: member.total_leave,
        used_leave: member.used_leave,
        remain_days: member.remain_days,
        // 기존 구조 호환을 위한 필드들
        annual_used: member.used_leave,
        monthly_used: 0, // API에서 별도 관리하지 않으므로 기본값
        sick_used: 0 // API에서 별도 관리하지 않으므로 기본값
      }));

      setMembers(transformedMembers);
    } catch (err) {
      console.error('연차 데이터 조회 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchMembersLeaveData();
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

  // API 연동으로 인해 더 이상 사용하지 않는 함수
  // const handleUse = (id, type) => { ... };

  // 연차/월차/병가 직접 수정 모달
  const openEditModal = (m) => {
    setEditMember({ ...m });
    setEditModal(true);
  };

  // 연차 부여 모달 열기
  const openGrantLeaveModal = () => {
    setGrantLeaveForm({
      targetMember: "",
      amount: 1,
      reason: ""
    });
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
        alert('로그인이 필요합니다.');
        return;
      }

      const response = await fetch(`${apiUrl}/leave/generate`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selectedMembers
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        alert(result.msg || '연차 생성에 실패했습니다.');
        return;
      }
      
      // 성공시 알림
      alert(result.msg || `선택된 ${selectedMembers.length}명의 사원에게 정책 기반 연차가 생성되었습니다.`);
      
      // 데이터 새로고침
      await fetchMembersLeaveData();
      
      // 선택 해제 및 모달 닫기
      setSelectedMembers([]);
      setSelectAll(false);
      setGrantLeaveModal(false);
    } catch (error) {
      console.error('연차 생성 실패:', error);
      alert('연차 생성 중 오류가 발생했습니다.');
    }
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

  // 전체 선택 토글
  const handleSelectAll = () => {
    const filtered = members.filter(m => 
      m.id.includes(search) || m.name.includes(search)
    );
    
    if (selectAll) {
      setSelectedMembers([]);
      setSelectAll(false);
    } else {
      setSelectedMembers(filtered.map(m => m.id));
      setSelectAll(true);
    }
  };

  // 선택된 사원들에게 연차 부여
  const openGrantLeaveModalForSelected = () => {
    if (selectedMembers.length === 0) {
      alert("연차를 부여할 사원을 선택해주세요.");
      return;
    }
    
    setGrantLeaveForm({
      targetMember: "", // 다중 선택이므로 빈값
      amount: 1,
      reason: ""
    });
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
      m.id.includes(search) || 
      m.name.includes(search) || 
      (m.dept_name && m.dept_name.includes(search)) ||
      (m.level_name && m.level_name.includes(search))
  );

  // 필터링된 결과에 따라 전체 선택 상태 업데이트
  useEffect(() => {
    if (filtered.length > 0) {
      const allFilteredSelected = filtered.every(m => selectedMembers.includes(m.id));
      setSelectAll(allFilteredSelected && filtered.length > 0);
    } else {
      setSelectAll(false);
    }
  }, [filtered, selectedMembers]);

  return (
      <div>
        <Header />
        <div className="wrap padding_60_0">
          <div className="main_box flex_1 vacation_policy_box">
            <div className="card_title font_700 mb_20">연차 발생 규칙 관리</div>
            <div className="flex justify_between align_center mb_20">
              <form onSubmit={e => e.preventDefault()} className="flex gap_10">
                <input
                    className="board_write_input"
                    style={{width: 220}}
                    placeholder="이름 검색"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
              </form>
              <button className="board_btn" onClick={() => setEditPolicy(true)}>정책 수정</button>
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
              <tr>
                <td>{policy.year}</td>
                <td>{policy.annual}</td>
                <td>{policy.monthly}</td>
                <td>1월 1일</td>
                <td>매월 만근시 1일</td>
                <td></td>
              </tr>
              </tbody>
            </table>
            <div className="card_title font_700 mt_30 mb_20">사원별 연차/월차 현황</div>
            <div className="flex justify_between align_center mb_20">
              <div></div>
              <button className="board_btn" onClick={openGrantLeaveModalForSelected}>연차 생성</button>
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
                <th>수정/사용</th>
              </tr>
              </thead>
              <tbody>
              {loading && <tr><td colSpan={9} style={{textAlign: 'center', color: '#aaa'}}>데이터를 불러오는 중입니다...</td></tr>}
              {error && <tr><td colSpan={9} style={{textAlign: 'center', color: 'red'}}>{error}</td></tr>}
              {filtered.length === 0 && !loading && !error && (
                  <tr>
                    <td colSpan={9} style={{textAlign: 'center', color: '#aaa'}}>검색 결과가 없습니다.</td>
                  </tr>
              )}
              {filtered.map(m => {
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
                      <td><b style={{color: m.remain_days > 0 ? '#2196F3' : '#f44336'}}>{m.remain_days}</b></td>
                      <td>
                        <button className="board_btn board_btn_small" onClick={() => openEditModal(m)}>직접수정</button>
                      </td>
                    </tr>
                );
              })}
              </tbody>
            </table>
          </div>

          {/* 정책 수정 모달 */}
          {editPolicy && (
              <div className="modal_overlay" onClick={() => setEditPolicy(false)}>
                <div className="modal_content" onClick={e => e.stopPropagation()}>
                  <h3 className="card_title font_700 mb_20">정책 수정</h3>
                  <form onSubmit={handlePolicySave} className="flex flex_column gap_10">
                    <div className="board_write_row">
                      <label className="board_write_label">년도</label>
                      <input
                          type="number"
                          className="board_write_input"
                          value={policy.annual}
                          min={1}
                          max={30}
                          onChange={e => setPolicy(p => ({ ...p, annual: e.target.value }))}
                      />
                    </div>
                    <div className="board_write_row">
                      <label className="board_write_label">연차(개)</label>
                      <input
                          type="number"
                          className="board_write_input"
                          value={policy.monthly}
                          min={1}
                          max={12}
                          onChange={e => setPolicy(p => ({ ...p, monthly: e.target.value }))}
                      />
                    </div>
                    <div className="board_write_row">
                      <label className="board_write_label">월차(개)</label>
                      <input
                          type="number"
                          className="board_write_input"
                          value={policy.sick}
                          min={1}
                          max={30}
                          onChange={e => setPolicy(p => ({ ...p, sick: e.target.value }))}
                      />
                    </div>
                    <div className="board_write_row">
                      <label className="board_write_label">연차 부여 기준일</label>
                      <input
                          type="number"
                          className="board_write_input"
                          value={policy.annualStartMonth}
                          min={1}
                          max={12}
                          onChange={e => setPolicy(p => ({ ...p, annualStartMonth: e.target.value }))}
                      />
                    </div>
                    <div className="board_write_row">
                      <label className="board_write_label">월차 부여 기준일</label>
                      <input
                          type="number"
                          className="board_write_input"
                          value={policy.monthlyStartMonth}
                          min={1}
                          max={12}
                          onChange={e => setPolicy(p => ({ ...p, monthlyStartMonth: e.target.value }))}
                      />
                    </div>
                    <div className="board_write_row">
                      <label className="board_write_label">비고</label>
                      <input
                          type="number"
                          className="board_write_input"
                          value={policy.sickStartMonth}
                          min={1}
                          max={12}
                          onChange={e => setPolicy(p => ({ ...p, sickStartMonth: e.target.value }))}
                      />
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

          {/* 연차 생성 모달 */}
          {grantLeaveModal && (
              <div className="modal_overlay" onClick={() => setGrantLeaveModal(false)}>
                <div className="modal_content" onClick={e => e.stopPropagation()}>
                  <h3 className="card_title font_700 mb_20">정책 기반 연차 생성</h3>
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
                        <strong>연차 생성 정책:</strong><br/>
                        • 신규 입사자 (1년 미만): 입사월부터 연말까지 월차<br/>
                        • 기존 사원 (1년 이상): 15일 + (근속년수-1)일<br/>
                        각 사원의 입사일과 근속년수에 따라 자동으로 계산됩니다.
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
