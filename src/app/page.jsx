'use client';

import Link from "next/link";
import React, {useState} from "react";
import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

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
  const [form, setForm] = useState({ id: "", password: "" });

  const [idImage, setIdImage] = useState(1);
  const [pwImage, setPwImage] = useState(9);
  const [pwFocus, setPwFocus] = useState(false);

  // 모달 상태
  const [findIdOpen, setFindIdOpen] = useState(false);
  const [findPwOpen, setFindPwOpen] = useState(false);

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

  const handleChange = e => {
    const { name, value } = e.target;
    
    // 아이디와 비밀번호에만 영어와 숫자만 허용
    if (name === 'id' || name === 'password') {
      // 한글이나 특수문자가 포함되어 있는지 확인
      if (/[^a-zA-Z0-9]/.test(value)) {
        alert('아이디와 비밀번호는 영어와 숫자만 입력 가능합니다.');
        return; // 입력 차단
      }
      setForm({ ...form, [name]: value });
    } else {
      setForm({ ...form, [name]: value });
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/member/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: form.id,
          password: form.password,
        }),
      });

      const data = await response.json();


      if (data.success) {
        // JWT 토큰을 세션 스토리지에 저장

        if (data.token) {
          sessionStorage.setItem('token', data.token);
        }
        sessionStorage.setItem('userId', form.id);
        let myAuth=[];

        // 권한정보추가
        axios.get(`${apiUrl}/auth/paeneol/${form.id}`,
            {headers: {Authorization: data.token}}).then(({data}) => {
              console.log('paeneol?: ', data);
              myAuth = data.my_auth.map((item) => {
                return item;
              });

              myAuth.forEach((auth, i) => {
                sessionStorage.setItem(`auth${i}`, JSON.stringify(auth));
              });

            }
        )


        // 로그인 성공 후 리다이렉트 (예: 메인 페이지)
        window.location.href = '/component/main';
      } else {
        alert(data.message || "로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };


  // 아이디 찾기 폼 상태
  const [findIdForm, setFindIdForm] = useState({ name: "", email: "" });
  const [findIdResult, setFindIdResult] = useState("");
  const [isFindingId, setIsFindingId] = useState(false);

  const handleFindIdChange = e => {
    const { name, value } = e.target;
    
    // 이메일 입력 시 한글이나 특수문자 차단
    if (name === 'email') {
      // 이메일은 @._- 허용
      if (/[^a-zA-Z0-9@._-]/.test(value)) {
        alert('이메일은 영어, 숫자, @, ., _, - 만 입력 가능합니다.');
        return; // 입력 차단
      }
      setFindIdForm({ ...findIdForm, [name]: value });
    } else {
      setFindIdForm({ ...findIdForm, [name]: value });
    }
  };

  const handleFindId = async (e) => {
    e.preventDefault();
    setIsFindingId(true);

    try {
      const response = await fetch(`${apiUrl}/member/find-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: findIdForm.name,
          email: findIdForm.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFindIdResult(data.message);
      } else {
        setFindIdResult(data.message);
      }
    } catch (error) {
      console.error('아이디 찾기 오류:', error);
      setFindIdResult('아이디 찾기 중 오류가 발생했습니다.');
    } finally {
      setIsFindingId(false);
    }
  };

  // 비밀번호 찾기 폼 상태
  const [findPwForm, setFindPwForm] = useState({ userId: "", email: "" });
  const [findPwResult, setFindPwResult] = useState("");
  const [isFindingPw, setIsFindingPw] = useState(false);

  const handleFindPwChange = e => {
    const { name, value } = e.target;
    
    // 아이디 입력 시 영어와 숫자만 허용
    if (name === 'userId') {
      // 한글이나 특수문자가 포함되어 있는지 확인
      if (/[^a-zA-Z0-9]/.test(value)) {
        alert('아이디는 영어와 숫자만 입력 가능합니다.');
        return; // 입력 차단
      }
      setFindPwForm({ ...findPwForm, [name]: value });
    } else if (name === 'email') {
      // 이메일은 @._- 허용
      if (/[^a-zA-Z0-9@._-]/.test(value)) {
        alert('이메일은 영어, 숫자, @, ., _, - 만 입력 가능합니다.');
        return; // 입력 차단
      }
      setFindPwForm({ ...findPwForm, [name]: value });
    } else {
      setFindPwForm({ ...findPwForm, [name]: value });
    }
  };

  const handleFindPw = async (e) => {
    e.preventDefault();
    setIsFindingPw(true);

    try {
      const response = await fetch(`${apiUrl}/email/find-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: findPwForm.userId,
          email: findPwForm.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFindPwResult(data.message);
      } else {
        setFindPwResult(data.message);
      }
    } catch (error) {
      console.error('비밀번호 찾기 오류:', error);
      setFindPwResult('비밀번호 찾기 중 오류가 발생했습니다.');
    } finally {
      setIsFindingPw(false);
    }
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
                <label htmlFor="id" className="login_label small_text">아이디</label>
                <input
                    id="id"
                    name="id"
                    className="login_input"
                    type="text"
                    placeholder="아이디를 입력하세요"
                    value={form.id}
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
            <button
                type="submit"
                className="login_btn"
                style={{ width: "100%" }}
                disabled={isFindingId}
            >
              {isFindingId ? "찾는 중..." : "아이디 찾기"}
            </button>
            {findIdResult && (
                <div className="modal_result mt_16" style={{
                  padding: '10px',
                  backgroundColor: findIdResult.includes('찾았습니다') ? '#e8f5e8' : '#ffe8e8',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  {findIdResult}
                </div>
            )}
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
            <button
                type="submit"
                className="login_btn"
                style={{ width: "100%" }}
                disabled={isFindingPw}
            >
              {isFindingPw ? "처리 중..." : "비밀번호 찾기"}
            </button>
            {findPwResult && (
                <div className="modal_result" style={{
                  padding: '10px',
                  backgroundColor: findPwResult.includes('발송되었습니다') ? '#e8f5e8' : '#ffe8e8',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  {findPwResult}
                </div>
            )}
          </form>
        </Modal>
      </div>
  );
}