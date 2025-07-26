'use client';

import Footer from "@/app/Footer";
import Header from "@/app/Header";
import Link from "next/link";
import React, {useState, useEffect, useRef} from "react";
import axios from "axios";
import {checkAuthStore} from "@/app/zustand/store";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// 날짜를 MM월 DD일로 포맷팅하는 함수
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}월 ${dd}일`;
};

export default function Board() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const block= checkAuthStore();  // 유저정보갖고오기
  const [visibleButton, setVisibleButton] = useState(false);

  useEffect(() => {
    if(sessionStorage){
      callUserInfo().then({

      })
    }
  },[]);

  // 서버에서 유저정보 불러오는 기능
  const callUserInfo = async () => {
    let {data} = await axios.get(`${apiUrl}/mypage/info`, {headers: {Authorization: sessionStorage.getItem('token')}});
    setVisibleButton(block.checkUserLv({user_lv:data.data.lv_idx, authLevel: 3}));
  }

  // 게시글 리스트 불러오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = sessionStorage.getItem("token");
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


  // category가 'NOTICE'인 글만 필터링
  const boardPosts = posts.filter(post => post.category === 'NOTICE');

  // 검색 필터링
  const filteredPosts = boardPosts.filter(
    post =>
      (post.subject || "").toLowerCase().includes(search.toLowerCase()) ||
      (post.user_id || "").toLowerCase().includes(search.toLowerCase())
  );

  const POSTS_PER_PAGE = 15;
  const startIdx = 0;
  const endIdx = POSTS_PER_PAGE;
  const currentPosts = filteredPosts.slice(startIdx, endIdx);
  // totalPages는 서버에서 내려주면 그걸 쓰고, 없으면 클라이언트에서 계산
  const calcTotalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > (totalPages || calcTotalPages)) return;
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
          <div className="card_title font_700 text_center">공지사항</div>
          <div className="board_search_wrap">
            <input
              className="board_search_input"
              type="text"
              placeholder="제목 또는 작성자 검색"
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
                <th className="small_text">등록일</th>
              </tr>
            </thead>
            <tbody>
              {/* 상단 고정 여부 티내고 싶으미 */}
              {currentPosts.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: "#aaa", padding: "32px 0" }}>검색 결과가 없습니다.</td>
                </tr>
              ) : (
                currentPosts.map((post) => (
                  <tr
                  key={post.post_idx}
                  style={post.pinned ? { background: "#d9cdfa" } : {}}>
                    <td>{post.post_idx}</td>
                    <td className="board_title">
                      <Link href={`/component/board/board_detail/${post.post_idx}`}>
                        {post.subject}
                      </Link>
                    </td>
                    <td>{post.user_id}</td>
                    <td>{formatDate(post.reg_date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="board_pagination">
            <button
              className="board_btn"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              이전
            </button>
            {[...Array(totalPages || calcTotalPages)].map((_, idx) => (
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
              disabled={page === (totalPages || calcTotalPages)}
            >
              다음
            </button>
          </div>
          <div className="board_footer">
            {visibleButton ? (<Link href="/component/board/board_write">
              <button className="board_btn">글쓰기</button>
            </Link>) : null}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}