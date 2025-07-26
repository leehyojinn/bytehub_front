'use client';

import Footer from "@/app/Footer";
import Header from "@/app/Header";
import Link from "next/link";
import React, {use, useEffect, useState} from "react";
import axios from "axios";
import {checkAuthStore, useAlertModalStore} from "@/app/zustand/store";

const POSTS_PER_PAGE = 15;

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// 날짜를 MM월 DD일로 포맷팅하는 함수
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}월 ${dd}일`;
};

// 참석자 배열을 포맷팅하는 함수
const formatAttendees = (attendees) => {
  if (!attendees || attendees.length === 0) return "-";
  if (Array.isArray(attendees)) {
    // 중복 제거
    const uniqueAttendees = [...new Set(attendees)];
    
    if (uniqueAttendees.length === 1) {
      return uniqueAttendees[0];
    } else if (uniqueAttendees.length > 1) {
      return `${uniqueAttendees[0]}, ...`;
    }
  }
  return attendees;
};


export default function MeetingList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState([]);
  // const [totalPages, setTotalPages] = useState(1);
  const block= checkAuthStore();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(null);
  const [currentUserLevel, setCurrentUserLevel] = useState(null);

  const [visibleButton, setVisibleButton] = useState(false);

  // JWT 토큰에서 사용자 ID를 추출하는 함수
  const getUserIdFromToken = () => {
    const token = sessionStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || null;
    } catch {
      return null;
    }
  };

  // 현재 사용자 정보 가져오기
  const fetchCurrentUserInfo = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${apiUrl}/mypage/info`, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const userInfo = response.data.data;
        setCurrentUserName(userInfo.name);
        setCurrentUserLevel(userInfo.lv_idx);
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
    }
  };

  // 권한 체크 함수
  const hasFullAccess = () => {
    return currentUserLevel === 1 || currentUserLevel === 2;
  };

  // 회의록작성 버튼 보여주는 여부
  const showWriteButton=()=>{
    setVisibleButton(block.isBlockId({
      session:sessionStorage,
      type:'board',
      idx:0,
      auth:'w',
    }));
  }

  // 게시글 리스트 불러오기
  useEffect(() => {
    showWriteButton();
    
    // 현재 로그인한 사용자 ID 설정
    const userId = getUserIdFromToken();
    setCurrentUserId(userId);
    
    // 현재 사용자 정보 가져오기
    fetchCurrentUserInfo();
    
    const fetchPosts = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const response = await axios.get(`${apiUrl}/post/list/${page}`, {
          headers: {
            Authorization: token,
          },
        });
        const data = response.data;
        setPosts(data.list || []);
        // 페이지네이션 정보가 필요하면 data.page 등 활용
        // setTotalPages(data.totalPages || 1); // totalPages가 있으면 사용
      } catch (err) {
        setPosts([]);
      }
    };
    fetchPosts();
  }, [page]);

  // category가 'MEETING'이고 권한에 따라 필터링
  const meetingPosts = posts.filter(post => {
    if (post.category !== 'MEETING') return false;
    
    // lv_idx 1,2인 사용자는 모든 회의록 볼 수 있음
    if (hasFullAccess()) return true;
    
    // 본인이 작성자인지 확인
    if (post.user_id === currentUserId) return true;
    
    // 본인이 참가자인지 확인 (이름으로 비교)
    const attendees = post.attendees;
    if (attendees && attendees.length > 0 && currentUserName) {
      return attendees.includes(currentUserName);
    }
    
    return false;
  });

  // 검색 필터링 (제목, 작성자, 참가자, 요약은 ㄴㄴ)
  const filteredPosts = meetingPosts.filter(
    post => {
      const attendeesText = Array.isArray(post.attendees) ? post.attendees.join(" ") : (post.attendees || "");
      return (
        (post.subject || "").toLowerCase().includes(search.toLowerCase()) ||
        (post.user_id || "").toLowerCase().includes(search.toLowerCase()) ||
        attendeesText.toLowerCase().includes(search.toLowerCase()) ||
        (post.summary || "").toLowerCase().includes(search.toLowerCase())
      );
    }
  );

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

  const startIdx = (page - 1) * POSTS_PER_PAGE;
  const endIdx = startIdx + POSTS_PER_PAGE;
  const currentPosts = filteredPosts.slice(startIdx, endIdx);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  // 검색어 입력 시 1페이지로 이동
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="board_card padding_60_0">
          <div className="card_title font_700 text_center">회의록</div>
          {/* 검색창 */}
          <div className="board_search_wrap">
            <input
              className="board_search_input"
              type="text"
              placeholder="제목, 작성자, 참가자 검색"
              value={search}
              onChange={handleSearchChange}
            />
            <button className="board_search_btn" tabIndex={-1}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="7" stroke="#433878" strokeWidth="2"/>
                <line x1="14.2" y1="14.2" x2="18" y2="18" stroke="#433878" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="board_table">
              <thead>
                <tr>
                  <th className="small_text">번호</th>
                  <th className="small_text">제목</th>
                  <th className="small_text">작성자</th>
                  <th className="small_text">참가자</th>
                  <th className="small_text">등록일</th>
                </tr>
              </thead>
              <tbody>
                {currentUserId === null ? (
                  <tr>
                    <td colSpan={6} style={{ color: "#aaa", padding: "32px 0" }}>로그인이 필요합니다.</td>
                  </tr>
                ) : currentPosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ color: "#aaa", padding: "32px 0" }}>
                      {search ? "검색 결과가 없습니다." : 
                       hasFullAccess() ? "회의록이 없습니다." : "작성하거나 참가자로 등록된 회의록이 없습니다."}
                    </td>
                  </tr>
                ) : (
                  currentPosts.map((post) => (
                      <tr key={post.post_idx}>
                        <td>{post.post_idx}</td>
                        <td className="board_title">
                          <Link href={`/component/meeting/meeting_detail/${post.post_idx}`}>
                            {post.subject}
                          </Link>
                        </td>
                        <td>{post.user_id}</td>
                        <td>{formatAttendees(post.attendees)}</td>
                        <td>{formatDate(post.reg_date)}</td>
                      </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* 페이지네이션 */}
          <div className="board_pagination">
            <button
              className="board_btn"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              이전
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx + 1}
                className={`board_btn board_page_btn${page === idx + 1 ? " active" : ""}`}
                onClick={() => handlePageChange(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              className="board_btn"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              다음
            </button>
          </div>
          <div className="board_footer">
            {
              visibleButton ?
                  <Link href="/component/meeting/meeting_write">
                    <button className="board_btn">회의록 작성</button>
                  </Link> : null
            }
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
