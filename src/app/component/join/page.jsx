'use client';

import React, { useState } from "react";

const departments = [
  { id: 1, name: "개발팀" },
  { id: 2, name: "기획팀" },
  { id: 3, name: "디자인팀" },
];

const gender = [
  { id: 1, name: "남자" },
  { id: 2, name: "여자" },
];

const positions = [
  "사원", "주임", "대리", "과장", "차장", "부장", "이사", "팀장"
];

export default function Signup() {
  const [form, setForm] = useState({
    id: "",
    name: "",
    password: "",
    email: "",
    dept_id: "",
    position: "",
    hire_date: "",
    phone: "",
  });

  const [idImage, setIdImage] = useState(1);
  const [pwImage, setPwImage] = useState(9);
  const [pwFocus, setPwFocus] = useState(false);

  React.useEffect(() => {
    const len = form.id.length;
    let imgNum = 1;
    if (len === 0) imgNum = 1;
    else if (len >= 8) imgNum = 8;
    else imgNum = len;
    setIdImage(imgNum);
  }, [form.id]);

  React.useEffect(() => {
    if (pwFocus) {
      const len = form.password.length;
      let imgNum = 9;
      if (len === 0) imgNum = 9;
      else if (len === 1) imgNum = 9;
      else if (len === 2) imgNum = 10;
      else imgNum = 11;
      setPwImage(imgNum);
    } else {
      setPwImage(9);
    }
  }, [form.password, pwFocus]);

  const handlePhoneChange = e => {
    let value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length < 4) value = value;
    else if (value.length < 8) value = value.replace(/(\d{3})(\d{1,4})/, "$1-$2");
    else value = value.replace(/(\d{3})(\d{4})(\d{1,4})/, "$1-$2-$3");
    setForm({ ...form, phone: value });
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleIdCheck = () => {
    if (!form.id) {
      alert("아이디를 입력해 주세요.");
      return;
    }
    alert(`아이디 "${form.id}"는 사용 가능합니다.`);
  };

  const handleSubmit = e => {
    e.preventDefault();
    alert("회원가입 시도");
  };

  return (
    <div className="wrap">
      <div className="login_page">
        {/* 왼쪽: 배경+이미지, 입력에 따라 이미지 변경 */}
        <div className="login_left">
          <div className="login_visual_container">
            <img
              src={`/${pwFocus ? pwImage : idImage}.jpeg`}
              alt="회원가입 비주얼"
              className="login_visual_img transition_img"
            />
          </div>
          <div className="login_left_text">
            <h2>환영합니다!</h2>
            <p>스마트한 업무의 시작<br />Bytehub 그룹웨어</p>
          </div>
        </div>
        {/* 오른쪽: 회원가입 폼 */}
        <div className="login_right">
          <form className="login_form" onSubmit={handleSubmit} autoComplete="off">
            <h2 className="login_title font_700">회원가입</h2>
            <div className="login_input_row">
              <label htmlFor="id" className="login_label small_text">아이디</label>
              <div className="flex gap_10 align_center position_rel">
                <input
                  id="id"
                  name="id"
                  className="login_input"
                  type="text"
                  value={form.id}
                  onChange={handleChange}
                  required
                  style={{ flex: 1 }}
                  maxLength={20}
                />
                <button
                  type="button"
                  className="board_write_btn "
                  onClick={handleIdCheck}
                  style={{
                    position: "absolute",
                    right: "50%",
                    transform: "translate(310px,-3px)",
                  }}
                >
                  중복확인
                </button>
              </div>
            </div>
            <div className="login_input_row">
              <label htmlFor="name" className="login_label small_text">이름</label>
              <input id="name" name="name" className="login_input" type="text" value={form.name} onChange={handleChange} required />
            </div>
            <div className="login_input_row">
              <label htmlFor="email" className="login_label small_text">이메일</label>
              <input id="email" name="email" className="login_input" type="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="login_input_row">
              <label htmlFor="password" className="login_label small_text">비밀번호</label>
              <input
                id="password"
                name="password"
                className="login_input"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                onFocus={() => setPwFocus(true)}
                onBlur={() => setPwFocus(false)}
              />
            </div>
            <div className="flex align_center justify_center gap_10">
              <div className="login_input_row flex_1">
                <label htmlFor="dept_id" className="login_label small_text">성별</label>
                <select id="dept_id" name="dept_id" className="login_input" value={form.dept_id} onChange={handleChange} required>
                  <option value="">성별 선택</option>
                  {gender.map(gender => (
                    <option key={gender.id} value={gender.id}>{gender.name}</option>
                  ))}
                </select>
              </div>
              <div className="login_input_row flex_1">
                <label htmlFor="dept_id" className="login_label small_text">부서</label>
                <select id="dept_id" name="dept_id" className="login_input" value={form.dept_id} onChange={handleChange} required>
                  <option value="">부서 선택</option>
                  {departments.map(dep => (
                    <option key={dep.id} value={dep.id}>{dep.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap_10 justify_center align_center">
              <div className="login_input_row flex_1">
                <label htmlFor="position" className="login_label small_text">직책</label>
                <select id="position" name="position" className="login_input" value={form.position} onChange={handleChange} required>
                  <option value="">직책 선택</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>
              <div className="login_input_row flex_1">
                <label htmlFor="hire_date" className="login_label small_text">입사일</label>
                <input id="hire_date" name="hire_date" className="login_input" type="date" value={form.hire_date} onChange={handleChange} required />
              </div>
            </div>
            <div className="login_input_row">
              <label htmlFor="phone" className="login_label small_text">연락처</label>
              <input
                id="phone"
                name="phone"
                className="login_input"
                type="tel"
                value={form.phone}
                onChange={handlePhoneChange}
                required
                placeholder="010-0000-0000"
                maxLength={13}
              />
            </div>
            <button type="submit" className="login_btn">회원가입</button>
          </form>
        </div>
      </div>
    </div>
  );
}
