'use client';

import Footer from "@/app/Footer";
import Header from "@/app/Header";
import React, {useEffect, useRef, useState} from "react";
import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function EmergencyContact() {

  const [departments, setDepartments] = useState([
    { dept_idx: 1, dept_name: "" },
    { dept_idx: 2, dept_name: "" },
  ]);

  const [users, setUsers] = useState([
    { user_id: 1, name: "홍대표", email: "ceo@bytehub.com", dept_idx: 1 },
    { user_id: 2, name: "김부장", email: "manager@bytehub.com", dept_idx: 1 },
    { user_id: 3, name: "박팀장", email: "leader@bytehub.com", dept_idx: 1 },
  ]);

  // 선택된 팀
  const [deptId, setDeptId] = useState(departments[0].dept_idx);

  // 기본 수신자(선택 팀 소속)
  const defaultReceivers = users.filter(u => u.dept_idx === deptId);
  const [receivers, setReceivers] = useState(defaultReceivers);

  // 새 수신자 추가 입력
  const [newReceiver, setNewReceiver] = useState({ name: "", email: "" });

  // 메일 폼
  const [mail, setMail] = useState({
    // sender: "",
    subject: "",
    content: "",
  });


  // 기계를믿어보는코드
  useEffect(() => {
    if (departments.length > 0) {
      setDeptId(departments[0].dept_idx);
    }
  }, [departments]);

  useEffect(() => {
    const teamUsers = users.filter(u => u.dept_idx === deptId);
    setReceivers(teamUsers);
  }, [deptId, users]);


  useEffect(() => {
    callDepts();
  }, []);

  const callDepts = async () => {
    let{data} = await axios.get(`${apiUrl}/email/depts`);
    setDepartments(data.list);
    callUsers();
  }

  const callUsers = async () => {
    let{data} = await axios.get(`${apiUrl}/email/users`);
    setUsers(data.list);
  }


  // 팀 변경 시 수신자 자동 변경
  const handleDeptChange = e => {
    const newDeptId = Number(e.target.value);
    console.log(newDeptId);
    setDeptId(newDeptId);
    const teamUsers = users.filter(u => u.dept_idx === newDeptId);
    setReceivers(teamUsers);
  };

  // 수신자 삭제
  const handleRemove = idx => {
    setReceivers(receivers.filter((_, i) => i !== idx));
  };

  // 수신자 추가
  const handleAdd = e => {
    e.preventDefault();
    if (!newReceiver.name || !newReceiver.email) return;
    setReceivers([...receivers, { ...newReceiver }]);
    setNewReceiver({ name: "", email: "" });
  };

  // 메일 폼 입력
  const handleMailChange = e => {
    setMail({ ...mail, [e.target.name]: e.target.value });
  };

  // 전송
  const handleSend = async (e) => {
    e.preventDefault();
    let{data}=await axios.post(`${apiUrl}/email/emergency`, {receiver:receivers, subject:mail.subject, content:mail.content});
    alert(data.msg);
    // alert("이메일 발송 \n\n수신자:\n" + receivers.map(r => `${r.name} <${r.email}>`).join("\n"));
  };

  return (
    <div>
      <Header/>
      <div className="wrap" style={{ padding: "60px 0", maxWidth: 700, margin: "0 auto" }}>
        <h2 className="card_title font_700 mb_30">비상연락망</h2>
        <form className="emergency_form" onSubmit={handleSend}>
          {/* 팀 선택 */}
          <div className="emergency_row">
            <label className="emergency_label">팀 선택</label>
            <select className="emergency_input" value={deptId} onChange={handleDeptChange}>
              {departments.map(dep => (
                <option key={dep.dept_idx} value={dep.dept_idx}>{dep.dept_name}</option>
              ))}
            </select>
          </div>
          {/* 수신자 리스트 */}
          <div className="emergency_row">
            <label className="emergency_label">수신자 이메일</label>
            <div className="emergency_receivers_list">
              {receivers.map((r, idx) => (
                <span key={idx} className="emergency_receiver_chip">
                  {r.name} &lt;{r.email}&gt;
                  <button type="button" className="emergency_remove_btn" onClick={() => handleRemove(idx)}>×</button>
                </span>
              ))}
            </div>
          </div>
          {/* 수신자 추가 (form -> div로 변경) */}
          <div className="emergency_add_form" style={{ marginBottom: 12, display: "flex", alignItems: "center" }}>
            <input
              className="emergency_input"
              type="text"
              placeholder="이름"
              value={newReceiver.name}
              onChange={e => setNewReceiver({ ...newReceiver, name: e.target.value })}
              style={{ width: 100, marginRight: 8 }}
            />
            <input
              className="emergency_input"
              type="email"
              placeholder="이메일"
              value={newReceiver.email}
              onChange={e => setNewReceiver({ ...newReceiver, email: e.target.value })}
              style={{ width: 210, marginRight: 8 }}
            />
            <button type="button" className="emergency_add_btn" onClick={handleAdd}>추가</button>
          </div>
          {/* 발신자/제목/내용 */}
          {/*<div className="emergency_row">*/}
          {/*  <label className="emergency_label">발신자</label>*/}
          {/*  <input*/}
          {/*    className="emergency_input"*/}
          {/*    type="text"*/}
          {/*    name="sender"*/}
          {/*    value={mail.sender}*/}
          {/*    onChange={handleMailChange}*/}
          {/*    required*/}
          {/*    placeholder="이름 또는 이메일"*/}
          {/*  />*/}
          {/*</div>*/}
          <div className="emergency_row">
            <label className="emergency_label">이메일 제목</label>
            <input
              className="emergency_input"
              type="text"
              name="subject"
              value={mail.subject}
              onChange={handleMailChange}
              required
              placeholder="이메일 제목"
            />
          </div>
          <div className="emergency_row">
            <label className="emergency_label">이메일 내용</label>
            <textarea
              className="emergency_input"
              name="content"
              value={mail.content}
              onChange={handleMailChange}
              required
              rows={5}
              placeholder="이메일 내용 입력"
            />
          </div>
          <button type="submit" className="emergency_send_btn">이메일 일괄 전송</button>
        </form>
      </div>
      <Footer/>
    </div>
  );
}
