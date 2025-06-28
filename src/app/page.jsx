'use client';

import Link from "next/link";
import React, { useState } from "react";

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="modal_overlay">
      <div className="modal_content">
        <button className="modal_close" onClick={onClose} aria-label="닫기">×</button>
        <div className="modal_title font_700">{title}</div>
        <div className="modal_body">{children}</div>
      </div>
    </div>
  );
}

export default function Login() {
  const [form, setForm] = useState({ userId: "", password: "" });

  const [idImage, setIdImage] = useState(1);
  const [pwImage, setPwImage] = useState(9);
  const [pwFocus, setPwFocus] = useState(false);

  // 모달 상태
  const [findIdOpen, setFindIdOpen] = useState(false);
  const [findPwOpen, setFindPwOpen] = useState(false);

  React.useEffect(() => {
    const len = form.userId.length;
    let imgNum = 1;
    if (len === 0) imgNum = 1;
    else if (len >= 8) imgNum = 8;
    else imgNum = len;
    setIdImage(imgNum);
  }, [form.userId]);

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

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    alert("로그인 시도");
  };

  // 아이디 찾기 폼 상태
  const [findIdForm, setFindIdForm] = useState({ name: "", email: "" });
  const [findIdResult, setFindIdResult] = useState("");
  const handleFindIdChange = e => {
    setFindIdForm({ ...findIdForm, [e.target.name]: e.target.value });
  };
  const handleFindId = e => {
    e.preventDefault();
    // 실제로는 서버에 요청
    setFindIdResult(`입력하신 정보로 찾은 아이디는: example_user 입니다.`);
  };

  // 비밀번호 찾기 폼 상태
  const [findPwForm, setFindPwForm] = useState({ userId: "", email: "" });
  const [findPwResult, setFindPwResult] = useState("");
  const handleFindPwChange = e => {
    setFindPwForm({ ...findPwForm, [e.target.name]: e.target.value });
  };
  const handleFindPw = e => {
    e.preventDefault();
    // 실제로는 서버에 요청
    setFindPwResult(
      "입력하신 이메일로 비밀번호 재설정 안내 메일을 발송했습니다."
    );
  };

  return (
    <div className="wrap">
      <div className="login_page">
        {/* 왼쪽: 배경+이미지 */}
        <div className="login_left">
          <div className="login_visual_container">
            <img
              src={`/${pwFocus ? pwImage : idImage}.jpeg`}
              alt="로그인 비주얼"
              className="login_visual_img transition_img"
            />
          </div>
          <div className="login_left_text">
            <h2>환영합니다!</h2>
            <p>스마트한 업무의 시작<br />Bytehub 그룹웨어</p>
          </div>
        </div>
        {/* 오른쪽: 로그인 폼 */}
        <div className="login_right">
          <form className="login_form" onSubmit={handleSubmit} autoComplete="off">
            <h2 className="login_title font_700">로그인</h2>
            <div className="login_input_row">
              <label htmlFor="userId" className="login_label small_text">아이디</label>
              <input
                id="userId"
                name="userId"
                className="login_input"
                type="text"
                placeholder="아이디를 입력하세요"
                value={form.userId}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>
            <div className="login_input_row">
              <label htmlFor="password" className="login_label small_text">비밀번호</label>
              <input
                id="password"
                name="password"
                className="login_input"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={form.password}
                onChange={handleChange}
                required
                onFocus={() => setPwFocus(true)}
                onBlur={() => setPwFocus(false)}
              />
            </div>
            <button type="submit" className="login_btn">로그인</button>
            <div className="login_links">
              <a
                href="#"
                className="login_link"
                onClick={e => {
                  e.preventDefault();
                  setFindIdOpen(true);
                  setFindIdResult("");
                  setFindIdForm({ name: "", email: "" });
                }}
              >
                아이디 찾기
              </a>
              <span className="login_link_divider">|</span>
              <a
                href="#"
                className="login_link"
                onClick={e => {
                  e.preventDefault();
                  setFindPwOpen(true);
                  setFindPwResult("");
                  setFindPwForm({ userId: "", email: "" });
                }}
              >
                비밀번호 찾기
              </a>
              <span className="login_link_divider">|</span>
              <Link href="/component/join" className="login_link">회원가입</Link>
            </div>
          </form>
        </div>
      </div>

      {/* 아이디 찾기 모달 */}
      <Modal open={findIdOpen} onClose={() => setFindIdOpen(false)} title="아이디 찾기">
        <form onSubmit={handleFindId} className="modal_form">
          <div className="modal_input_row">
            <label className="modal_label">이름</label>
            <input
              type="text"
              name="name"
              className="modal_input"
              value={findIdForm.name}
              onChange={handleFindIdChange}
              required
            />
          </div>
          <div className="modal_input_row">
            <label className="modal_label">이메일</label>
            <input
              type="email"
              name="email"
              className="modal_input"
              value={findIdForm.email}
              onChange={handleFindIdChange}
              required
            />
          </div>
          <button type="submit" className="login_btn" style={{ width: "100%" }}>
            아이디 찾기
          </button>
          {findIdResult && <div className="modal_result mt_16">{findIdResult}</div>}
        </form>
      </Modal>

      {/* 비밀번호 찾기 모달 */}
      <Modal open={findPwOpen} onClose={() => setFindPwOpen(false)} title="비밀번호 찾기">
        <form onSubmit={handleFindPw} className="modal_form">
          <div className="modal_input_row">
            <label className="modal_label">아이디</label>
            <input
              type="text"
              name="userId"
              className="modal_input"
              value={findPwForm.userId}
              onChange={handleFindPwChange}
              required
            />
          </div>
          <div className="modal_input_row">
            <label className="modal_label">이메일</label>
            <input
              type="email"
              name="email"
              className="modal_input"
              value={findPwForm.email}
              onChange={handleFindPwChange}
              required
            />
          </div>
          <button type="submit" className="login_btn" style={{ width: "100%" }}>
            비밀번호 찾기
          </button>
          {findPwResult && <div className="modal_result">{findPwResult}</div>}
        </form>
      </Modal>
    </div>
  );
}
