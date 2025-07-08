'use client';

import axios from "axios";
import React, { useEffect, useState } from "react";

const gender = [
  { id: 1, name: "남자" },
  { id: 2, name: "여자" },
];

export default function Signup() {
  const [form, setForm] = useState({
    user_id: "",
    name: "",
    password: "",
    email: "",
    gender: "",
    dept_idx: "",
    lv_idx: "",
    hire_date: "",
    phone: "",
  });

  const [idImage, setIdImage] = useState(1);
  const [pwImage, setPwImage] = useState(9);
  const [pwFocus, setPwFocus] = useState(false);
  const [isIdAvailable, setIsIdAvailable] = useState(false); // 아이디 사용 가능 여부
  const [isIdChecked, setIsIdChecked] = useState(false); // 아이디 중복체크 완료 여부

  const [dept,setDept] = useState([]);
  const [level,setLevel] = useState([]);

  const api_url = process.env.NEXT_PUBLIC_API_URL;

  async function dept_list() {
    let {data} = await axios.post(`${api_url}/dept/list`);
    const list = data.list.filter((item)=>item.status == false)
    setDept(list);
  }

  async function level_list() {
    let {data} = await axios.post(`${api_url}/level/list`);
    const list = data.list.filter((item)=>item.status == false)
    setLevel(list);
  }
  useEffect(()=>{
    dept_list();
    level_list();
  },[])

  React.useEffect(() => {
    const len = form.user_id.length;
    let imgNum = 1;
    if (len === 0) imgNum = 1;
    else if (len >= 8) imgNum = 8;
    else imgNum = len;
    setIdImage(imgNum);
  }, [form.user_id]);

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

    // 아이디가 변경되면 중복체크 상태 초기화
    if (name === 'user_id') {
      setIsIdChecked(false);
      setIsIdAvailable(false);
    }
  };

  const handleIdCheck = async () => {
    if (!form.user_id) {
      alert("아이디를 입력해 주세요.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:80/member/overlay/${form.user_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.use) {
        alert(`아이디 "${form.user_id}"는 사용 가능합니다.`);
        setIsIdAvailable(true);
        setIsIdChecked(true);
      } else {
        alert(`아이디 "${form.user_id}"는 이미 사용 중입니다.`);
        setIsIdAvailable(false);
        setIsIdChecked(true);
      }
    } catch (error) {
      console.error('아이디 중복체크 오류:', error);
      alert('아이디 중복체크 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 아이디 중복체크 확인
    if (!isIdChecked) {
      alert("아이디 중복체크를 해주세요.");
      return;
    }

    if (!isIdAvailable) {
      alert("사용할 수 없는 아이디입니다.");
      return;
    }

    try {
      const response = await fetch('http://localhost:80/member/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: form.user_id,
          password: form.password,
          name: form.name,
          email: form.email,
          gender: form.gender === "1" ? "M" : "F",
          dept_idx: parseInt(form.dept_idx) || 0,
          lv_idx: parseInt(form.lv_idx) || 0,
          hire_date: form.hire_date,
          file_idx: 1, // 기본값 (0이면 회원가입이 안되기에...)
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("회원가입이 완료되었습니다!");
        // 폼 초기화
        setForm({
          user_id: "",
          name: "",
          password: "",
          email: "",
          gender: "",
          dept_idx: "",
          lv_idx: "",
          hire_date: "",
          phone: ""
        });
        setIsIdChecked(false);
        setIsIdAvailable(false);
        window.location.href = '/';
      } else {
        alert(`회원가입 실패: ${data.msg}`);
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      alert('회원가입 중 오류가 발생했습니다.');
    }
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
                <label htmlFor="user_id" className="login_label small_text">아이디</label>
                <div className="flex gap_10 align_center position_rel">
                  <input
                      id="user_id"
                      name="user_id"
                      className="login_input"
                      type="text"
                      value={form.user_id}
                      onChange={handleChange}
                      required
                      style={{ flex: 1 }}
                      maxLength={20}
                  />
                  <button
                      type="button"
                      className="board_write_btn"
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
                {isIdChecked && (
                    <div style={{
                      fontSize: '12px',
                      marginTop: '5px',
                      color: isIdAvailable ? 'green' : 'red'
                    }}>
                      {isIdAvailable ? '✓ 사용 가능한 아이디입니다.' : '✗ 이미 사용 중인 아이디입니다.'}
                    </div>
                )}
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
                  <label htmlFor="gender" className="login_label small_text">성별</label>
                  <select id="gender" name="gender" className="login_input" value={form.gender} onChange={handleChange} required>
                    <option value="">성별 선택</option>
                    {gender.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div className="login_input_row flex_1">
                  <label htmlFor="dept_idx" className="login_label small_text">부서</label>
                  <select id="dept_idx" name="dept_idx" className="login_input" value={form.dept_idx} onChange={handleChange} required>
                    <option value="">부서 선택</option>
                    {dept.map(dep => (
                        <option key={dep.dept_idx} value={dep.dept_idx}>{dep.dept_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap_10 justify_center align_center">
                <div className="login_input_row flex_1">
                  <label htmlFor="lv_idx" className="login_label small_text">직책</label>
                  <select id="lv_idx" name="lv_idx" className="login_input" value={form.lv_idx} onChange={handleChange} required>
                    <option value="">직책 선택</option>
                    {level.map((pos) => (
                        <option key={pos.lv_idx} value={pos.lv_idx}>{pos.lv_name}</option>
                    ))}
                  </select>
                </div>
                <div className="login_input_row flex_1">
                  <label htmlFor="hire_date" className="login_label small_text">입사일</label>
                  <input id="hire_date" name="hire_date" className="login_input" type="date" value={form.hire_date} onChange={handleChange} required />
                </div>
              </div>
              {/* <div className="login_input_row">
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
              </div> */}
              <button type="submit" className="login_btn">회원가입</button>
            </form>
          </div>
        </div>
      </div>
  );
}