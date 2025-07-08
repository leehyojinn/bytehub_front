'use client';

import Footer from "@/app/Footer";
import Header from "@/app/Header";
import Link from "next/link";
import React, {useEffect, useState} from "react";
import axios from "axios";

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

export default function MeetingList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState([]);
  // const [totalPages, setTotalPages] = useState(1);

  // 게시글 리스트 불러오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${apiUrl}/post/list/${page}`, {
          headers: {
            Authorization: token,
          },
        });
        const data = response.data;
        // data.list가 실제 게시글 배열
        setPosts(data.list || []);
        // 페이지네이션 정보가 필요하면 data.page 등 활용
        // setTotalPages(data.totalPages || 1); // totalPages가 있으면 사용
      } catch (err) {
        setPosts([]);
      }
    };
    fetchPosts();
  }, [page]);

  // category가 'MEETING'인 글만 필터링
  const meetingPosts = posts.filter(post => post.category === 'MEETING');

  // 검색 필터링 (제목, 작성자, 참가자, 요약)
  const filteredPosts = meetingPosts.filter(
    post =>
      (post.subject || "").toLowerCase().includes(search.toLowerCase()) ||
      (post.user_id || "").toLowerCase().includes(search.toLowerCase()) ||
      (post.attendees || "").toLowerCase().includes(search.toLowerCase()) ||
      (post.summary || "").toLowerCase().includes(search.toLowerCase())
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
              placeholder="제목, 작성자, 참가자, 요약 검색"
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
          <table className="board_table">
            <thead>
              <tr>
                <th className="small_text">번호</th>
                <th className="small_text">제목</th>
                <th className="small_text">작성자</th>
                <th className="small_text">참가자</th>
                <th className="small_text">요약</th>
                <th className="small_text">등록일</th>
              </tr>
            </thead>
            <tbody>
              {currentPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ color: "#aaa", padding: "32px 0" }}>검색 결과가 없습니다.</td>
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
                    <td>{post.attendees || '-'}</td>
                    <td>{post.summary || '-'}</td>
                    <td>{formatDate(post.reg_date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
            <Link href="/component/meeting/meeting_write">
              <button className="board_btn">회의록 작성</button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
