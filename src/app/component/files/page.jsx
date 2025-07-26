'use client';

import Footer from "@/app/Footer";
import Header from "@/app/Header";
import React, { useState, useEffect } from "react";



function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

export default function FileSystem() {
  // 사용자 정보 상태
  const [userInfo, setUserInfo] = useState(null);
  // 부서 목록 상태
  const [departments, setDepartments] = useState([]);
  // 선택된 부서
  const [selectedDeptIdx, setSelectedDeptIdx] = useState(null);
  // 파일/링크 리스트
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 페이징 관련 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLinkPage, setCurrentLinkPage] = useState(1);
  const [pageSize] = useState(10); // 페이지당 파일 수
  const [linkPageSize] = useState(5); // 페이지당 링크 수

  // 업로드 폼
  const [upload, setUpload] = useState({ files: [] });
  // 외부 링크 폼
  const [link, setLink] = useState({ title: "", url: "" });
  // 링크 수정 관련 상태
  const [editingLink, setEditingLink] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // 사용자 정보 가져오기
  const fetchUserInfo = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.error('토큰이 없습니다.');
        return;
      }

      
      const response = await fetch(`${apiUrl}/mypage/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUserInfo(result.data);
        } else {
          console.error('사용자 정보 조회 실패:', result.message);
        }
      } else {
        console.error('사용자 정보 조회 실패:', response.status);
      }
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
    }
  };

  // 부서 목록 가져오기
  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${apiUrl}/cloud/departments`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDepartments(result.data);
        } else {
          console.error('부서 목록 조회 실패:', result.message);
        }
      } else {
        console.error('부서 목록 조회 실패:', response.status);
      }
    } catch (error) {
      console.error('부서 목록 조회 오류:', error);
    }
  };

  // 부서 탭 클릭 시 해당 부서 파일 조회
  const onDeptTabClick = async (deptIdx) => {
    setSelectedDeptIdx(deptIdx);
    setCurrentPage(1); // 부서 변경 시 페이지를 1로 리셋
  };

  // 파일 목록 가져오기
  const fetchFiles = async (deptIdx) => {
    if (!deptIdx) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/cloud/list?deptIdx=${deptIdx}`);
      
      if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const fileList = result.data.map((file, index) => {
              return {
                id: file.file_idx || file.id || `temp-${Date.now()}-${index}`,
                folder_id: file.dept_idx || file.deptIdx || selectedDeptIdx,
                name: file.filename || file.name || '알 수 없는 파일',
                originalName: file.original_filename || file.originalName || file.filename || file.name || '알 수 없는 파일',
                uploader: file.uploader_name || file.user_id || file.uploader || '알 수 없음',
                user_id: file.user_id || '',
                dept_name: file.dept_name || '',
                size: file.size || file.file_size || 0,
                uploadDate: file.created_at ? new Date(file.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                expireDate: file.expire_date || file.expireDate || '',
                url: "#",
                teamOnly: false,
                uploader_lv_idx: file.lv_idx || file.uploader_lv_idx || file.uploaderLvIdx || null
              };
            });
            
            setFiles(fileList);
          } else {
            console.error('파일 목록 조회 실패:', result.message);
            setFiles([]);
          }
      } else {
          console.error('파일 목록 조회 실패:', response.status);
          setFiles([]);
        }
      } catch (error) {
        console.error('파일 목록 조회 오류:', error);
        setFiles([]);
      } finally {
        setIsLoading(false);
      }
  };

  // 컴포넌트 마운트 시 사용자 정보와 부서 목록 가져오기
  useEffect(() => {
    fetchUserInfo();
    fetchDepartments();
    fetchLinks();
  }, []);

  // 사용자 정보와 부서 목록이 로드되면 사용자의 부서를 기본 선택
  useEffect(() => {
    if (userInfo && departments.length > 0) {
      const userDeptIdx = userInfo.dept_idx || userInfo.deptIdx;
      const userLvIdx = userInfo.lv_idx || userInfo.lvIdx;
      
      // 사용자의 부서가 부서 목록에 있는지 확인
      const userDept = departments.find(dept => dept.dept_idx === userDeptIdx);
      if (userDept) {
        setSelectedDeptIdx(userDeptIdx);
      } else {
        // 사용자 부서가 없으면 첫 번째 부서 선택
        setSelectedDeptIdx(departments[0].dept_idx);
      }
    }
  }, [userInfo, departments]);

  // 사용자 레벨에 따른 부서 필터링
  const getFilteredDepartments = () => {
    if (!userInfo || !departments.length) return departments;
    
    const userLvIdx = userInfo.lv_idx || userInfo.lvIdx;
    const userDeptIdx = userInfo.dept_idx || userInfo.deptIdx;
    
    // lv_idx가 1,2인 경우 모든 부서 표시
    if (userLvIdx <= 2) {
      return departments;
    }
    
    // lv_idx가 3 이상인 경우 사용자 부서만 표시
    const userDept = departments.find(dept => dept.dept_idx === userDeptIdx);
    return userDept ? [userDept] : departments;
  };

  // 필터링된 부서 목록
  const filteredDepartments = getFilteredDepartments();

  // 선택된 부서가 변경될 때 파일 목록 가져오기
  useEffect(() => {
    if (selectedDeptIdx) {
      fetchFiles(selectedDeptIdx);
      fetchLinks(); // 부서 변경 시 링크도 새로 가져오기
    }
  }, [selectedDeptIdx]);

  // 파일 업로드
  const handleFileChange = e => {
    const selectedFiles = Array.from(e.target.files);
    const oversizedFiles = selectedFiles.filter(file => file.size > 10 * 1024 * 1024);
    const validFiles = selectedFiles.filter(file => file.size <= 10 * 1024 * 1024);
    
    // 10MB 초과 파일이 있으면 한 번에 알림
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(file => file.name).join(', ');
      alert(`다음 파일들은 10MB를 초과하여 제외됩니다:\n${fileNames}`);
    }
    
    setUpload({ ...upload, files: [...upload.files, ...validFiles] });
  };

  // 선택된 파일 삭제
  const handleRemoveFile = (index) => {
    const newFiles = upload.files.filter((_, i) => i !== index);
    setUpload({ ...upload, files: newFiles });
  };

  const handleUpload = async e => {
    e.preventDefault();
    if (upload.files.length === 0 || !selectedDeptIdx) return;

    try {
      // 실제 사용자 정보 가져오기
      const userId = sessionStorage.getItem('userId');
      if (!userId) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 각 파일을 동시에 업로드
      const uploadResults = [];
      const failedFiles = [];

      for (const file of upload.files) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('deptIdx', selectedDeptIdx);
          formData.append('user_id', userId);
          formData.append('expireDate', new Date().toISOString().slice(0, 10)); // 현재 날짜를 만료일로 설정

          const response = await fetch(`${apiUrl}/cloud/upload`, {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            
            const savedFile = result.data;
            uploadResults.push({
              id: savedFile?.file_idx || savedFile?.id || Date.now(),
              folder_id: Number(selectedDeptIdx),
              name: savedFile?.filename || savedFile?.name || file.name,
              originalName: file.name,
              uploader: userId,
              size: file.size,
              uploadDate: new Date().toISOString().slice(0, 10),
              expireDate: new Date().toISOString().slice(0, 10), // 현재 날짜로 설정
              url: "#",
              teamOnly: false
            });
          } else {
            const errorData = await response.json();
            console.error(`파일 업로드 실패: ${file.name}`, errorData);
            failedFiles.push(file.name);
          }
        } catch (error) {
          console.error(`파일 업로드 오류: ${file.name}`, error);
          failedFiles.push(file.name);
        }
      }
      
      // 성공한 파일들만 로컬 상태 업데이트
      if (uploadResults.length > 0) {
        setFiles(prevFiles => [...prevFiles, ...uploadResults]);
      }
      
      // 폼 초기화
      setUpload({ files: [] });
      
      // 파일 입력 필드 초기화
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
      
      // 결과 메시지
      let message = '';
      if (uploadResults.length > 0) {
        message += `${uploadResults.length}개 파일 업로드 성공`;
      }
      if (failedFiles.length > 0) {
        message += `\n${failedFiles.length}개 파일 업로드 실패: ${failedFiles.join(', ')}`;
      }
      alert(message || '업로드 완료');
      
      // 파일 목록 새로고침
      fetchFiles(selectedDeptIdx);
    } catch (error) {
      console.error('업로드 오류:', error);
      alert('파일 업로드 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 삭제 권한 확인 함수
  const canDeleteFile = (file) => {
    if (!userInfo) return false;
    
    const currentUserId = sessionStorage.getItem('userId');
    const currentUserLv = userInfo.lv_idx || userInfo.lvIdx;
    const fileUploaderLv = file.uploader_lv_idx || file.uploaderLvIdx;
    
    // 파일 업로더가 본인인 경우 삭제 가능
    if (file.user_id === currentUserId) return true;
    
    // 업로더 레벨 정보가 없는 경우 삭제 불가
    if (!fileUploaderLv) return false;
    
    // 상위 레벨이 하위 레벨의 파일을 삭제할 수 있음
    // lv_idx가 낮을수록 높은 권한 (1이 최고 권한)
    return currentUserLv <= fileUploaderLv;
  };

  // 파일 삭제
  const handleDelete = async (id) => {
    // 삭제 확인
    if (!confirm('정말로 이 파일을 삭제하시겠습니까?')) {
      return;
    }

    try {
      // user_id 파라미터 추가
      const userId = sessionStorage.getItem('userId');
      const params = new URLSearchParams();
      params.append('user_id', userId); // userId는 현재 로그인한 사용자 ID

      const response = await fetch(`${apiUrl}/cloud/delete/${id}?${params}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 로컬 상태에서도 삭제
          setFiles(files.filter(f => f.id !== id));
          alert('파일이 성공적으로 삭제되었습니다.');
        } else {
          alert('파일 삭제 실패: ' + (result.message || '알 수 없는 오류'));
        }
      } else {
        const errorData = await response.json();
        alert('파일 삭제 실패: ' + (errorData.message || '서버 오류'));
      }
    } catch (error) {
      console.error('파일 삭제 오류:', error);
      alert('파일 삭제 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 외부 링크 추가
  const handleLinkAdd = async e => {
    e.preventDefault();
    if (!link.title || !link.url) return;
    
    try {
      const userId = sessionStorage.getItem('userId');
      if (!userId) {
        alert('로그인이 필요합니다.');
        return;
      }

      // URL에 https:// 자동 추가
      let finalUrl = link.url;
      if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }

      const formData = new FormData();
      formData.append('linkName', link.title);
      formData.append('url', finalUrl);
      formData.append('user_id', userId);
      formData.append('deptIdx', selectedDeptIdx);

      const response = await fetch(`${apiUrl}/cloud/link/save`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          fetchLinks(); // 링크 목록 새로고침
          setLink({ title: "", url: "" });
          alert('링크가 저장되었습니다.');
        } else {
          alert(result.message || '링크 저장에 실패했습니다.');
        }
      } else {
        alert('링크 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('링크 저장 오류:', error);
      alert('링크 저장 중 오류가 발생했습니다.');
    }
  };


  // 링크 목록 가져오기
  const fetchLinks = async () => {
    try {
      const userId = sessionStorage.getItem('userId');
      if (!userId) {
        console.error('사용자 ID가 없습니다.');
        return;
      }

      // 현재 선택된 부서의 링크만 가져오기
      const response = await fetch(`${apiUrl}/cloud/link/list?user_id=${userId}&deptIdx=${selectedDeptIdx}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setLinks(result.data || []);
        } else {
          console.error('링크 목록 조회 실패:', result.message);
        }
      } else {
        console.error('링크 목록 조회 실패:', response.status);
      }
    } catch (error) {
      console.error('링크 목록 조회 오류:', error);
    }
  };

  // 링크 수정 모달 열기
  const handleEditLink = (link) => {
    setEditingLink({
      link_idx: link.link_idx,
      link_name: link.link_name,
      url: link.url
    });
    setShowEditModal(true);
  };

  // 링크 수정 처리
  const handleUpdateLink = async (e) => {
    e.preventDefault();
    if (!editingLink.link_name || !editingLink.url) return;
    
    try {
      const formData = new FormData();
      formData.append('linkIdx', editingLink.link_idx);
      formData.append('linkName', editingLink.link_name);
      formData.append('url', editingLink.url);
      formData.append('deptIdx', selectedDeptIdx);

      const response = await fetch(`${apiUrl}/cloud/link/update`, {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          fetchLinks(); // 링크 목록 새로고침
          setShowEditModal(false);
          setEditingLink(null);
          alert('링크가 수정되었습니다.');
        } else {
          alert(result.message || '링크 수정에 실패했습니다.');
        }
      } else {
        alert('링크 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('링크 수정 오류:', error);
      alert('링크 수정 중 오류가 발생했습니다.');
    }
  };

  // 링크 수정/삭제 권한 확인 - 본인만 가능
  const canEditLink = (link) => {
    if (!userInfo) return false;
    
    const currentUserId = sessionStorage.getItem('userId');
    
    // 본인이 올린 링크만 수정/삭제 가능
    return link.user_id === currentUserId;
  };

  // 외부 링크 삭제
  const handleLinkDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`${apiUrl}/cloud/link/delete/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          fetchLinks(); // 링크 목록 새로고침
          alert('링크가 삭제되었습니다.');
        } else {
          alert(result.message || '링크 삭제에 실패했습니다.');
        }
      } else {
        alert('링크 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('링크 삭제 오류:', error);
      alert('링크 삭제 중 오류가 발생했습니다.');
    }
  };



  // 파일의 만료일을 계산하는 함수 - Mac 호환성 개선
  const getFileExpireDate = (uploadDate) => {
    if (!uploadDate) return '';
    try {
    const uploadTime = new Date(uploadDate);
      // UTC 시간으로 변환하여 시간대 문제 해결
      const expireTime = new Date(uploadTime.getTime() + (30 * 24 * 60 * 60 * 1000));
    return expireTime.toISOString().slice(0, 10);
    } catch (error) {
      console.error('날짜 처리 오류:', error);
      return '';
    }
  };

  // 만료일까지 남은 일수를 계산하는 함수 - Mac 호환성 개선
  const getDaysUntilExpire = (uploadDate) => {
    if (!uploadDate) return null;
    try {
      const uploadTime = new Date(uploadDate);
      const expireTime = new Date(uploadTime.getTime() + (31 * 24 * 60 * 60 * 1000));
      const currentTime = new Date();
      const diffTime = expireTime.getTime() - currentTime.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error('만료일 계산 오류:', error);
      return null;
    }
  };

  // 현재 부서 파일만 표시 (숫자 타입으로 일관되게 처리)
  const deptFiles = files
    .filter(f => Number(f.folder_id) === Number(selectedDeptIdx));
  // 링크 필터링 로직: 현재 선택된 부서의 링크만 표시
  const getFilteredLinks = () => {
    if (!userInfo || !links.length) return [];
    
    const userLvIdx = userInfo.lv_idx || userInfo.lvIdx;
    
    return links.filter(link => {
      const linkUploaderLv = link.lv_idx || link.uploaderLvIdx || link.uploader_lv_idx;
      const linkDeptIdx = link.dept_idx;
      
      // 현재 선택된 부서의 링크만 표시
      if (Number(linkDeptIdx) !== Number(selectedDeptIdx)) {
        return false;
      }
      
      // lv_idx 1,2가 올린 링크는 모든 인원에게 보임
      if (linkUploaderLv <= 2) {
        return true;
      }
      
      // lv_idx 3 이상이 올린 링크는 해당 부서와 lv_idx 1,2에게만 보임
      if (linkUploaderLv >= 3) {
        // lv_idx 1,2는 모든 링크를 볼 수 있음
        if (userLvIdx <= 2) {
          return true;
        }
        // 다른 사용자는 같은 부서의 링크만 볼 수 있음 (이미 부서 필터링됨)
        return true;
      }
      
      return false;
    });
  };

  // 필터링된 링크 목록
  const filteredLinks = getFilteredLinks();

  // 페이징 관련 함수들
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleLinkPageChange = (page) => {
    setCurrentLinkPage(page);
  };

  // 현재 페이지의 파일들만 표시
  const getCurrentPageFiles = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return deptFiles.slice(startIndex, endIndex);
  };

  // 현재 페이지의 링크들만 표시
  const getCurrentPageLinks = () => {
    const startIndex = (currentLinkPage - 1) * linkPageSize;
    const endIndex = startIndex + linkPageSize;
    return filteredLinks.slice(startIndex, endIndex);
  };

  // 전체 페이지 수 계산
  const totalPages = Math.ceil(deptFiles.length / pageSize);
  const totalLinkPages = Math.ceil(filteredLinks.length / linkPageSize);

  return (
    <div>
        <Header/>
        <div className="wrap" style={{ padding: "60px 0", maxWidth: 900, margin: "0 auto" }}>
        <h2 className="card_title font_700 mb_30">팀별 파일함</h2>
        {userInfo && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '4px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#1976d2'
          }}>
            👤 현재 사용자: {userInfo.name} ({userInfo.dept_name || '부서 미지정'}) 
            {userInfo.lv_idx <= 2 ? ' - 전체 부서 파일함 접근 가능' : ' - 팀별 파일함 접근 가능'}
          </div>
        )}
        
        {/* 부서 탭 */}
        <div className="fs_dept_tabs" style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          borderBottom: '1px solid #ddd',
          paddingBottom: '10px',
          overflowX: 'auto',
          overflowY: 'hidden',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'thin',
          scrollbarColor: '#ccc transparent'
        }}>
          {filteredDepartments.map(dept => (
            <button
              key={`dept-${dept.dept_idx}-${dept.dept_name}`}
              onClick={() => onDeptTabClick(dept.dept_idx)}
                              style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: selectedDeptIdx === dept.dept_idx ? '#007bff' : '#fff',
                  color: selectedDeptIdx === dept.dept_idx ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: selectedDeptIdx === dept.dept_idx ? 'bold' : 'normal',
                  flex: filteredDepartments.length === 1 ? '0 1 auto' : '0 0 auto',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  minWidth: filteredDepartments.length === 1 ? 'auto' : '80px'
                }}
            >
              {dept.dept_name}
            </button>
          ))}
        </div>

        {/* 파일 업로드 */}
        <form className="fs_upload_form" onSubmit={handleUpload}>
            <div className="fs_upload_row">
            <label htmlFor="file-upload" className="board_file_label">
                파일 선택
            </label>
             <input
                className="upload-name flex_1"
                value={upload.files.length > 0 ? `${upload.files.length}개 파일 선택됨` : "첨부파일을 선택하세요"}
                placeholder="첨부파일"
                readOnly
                tabIndex={-1}
            />
            <input
                type="file"
                id="file-upload"
                style={{ display: "none" }}
                onChange={handleFileChange}
                accept="*"
                multiple
            />
            <button type="submit" className="fs_btn" disabled={upload.files.length === 0 || !selectedDeptIdx}>
                업로드
            </button>
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                ※ 파일 크기 제한: 100MB 이하
            </div>
            
            {/* 선택된 파일 목록 */}
            {upload.files.length > 0 && (
                <div style={{ 
                    marginTop: '10px', 
                    padding: '10px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>선택된 파일:</div>
                    {upload.files.map((file, index) => (
                        <div key={`upload-${file.name}-${file.size}-${Date.now()}-${index}`} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '4px 8px',
                            marginBottom: '4px',
                            backgroundColor: 'white',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {file.name} ({formatSize(file.size)})
                            </span>
                            <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#dc3545',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    padding: '0 4px'
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </form>
        
        {/* 파일 리스트 */}
        <div className="fs_filelist_box" style={{ 
            display: 'flex', 
            flexDirection: 'column',
            border: '1px solid #ddd',
            borderRadius: '8px',
        }}>
            <div className="fs_filelist_head" style={{
                display: 'flex',
                padding: '12px 16px',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #ddd',
                fontWeight: 'bold',
                fontSize: '16.32px'
            }}>
            <span style={{ flex: 2, minWidth: 0 }}>파일명</span>
            <span style={{ flex: 1, textAlign: 'center' }}>업로더</span>
            <span style={{ flex: 1, textAlign: 'center' }}>크기</span>
            <span style={{ flex: 1, textAlign: 'center' }}>업로드일</span>
            <span style={{ flex: 1, textAlign: 'center' }}>만료일</span>
            <span style={{ flex: 1, textAlign: 'center' }}>다운로드</span>
            <span style={{ flex: 1, textAlign: 'center' }}>삭제</span>
            </div>
            {isLoading ? (
            <div className="fs_filelist_empty" style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: '#666',
                fontSize: '16.32px'
            }}>파일 목록을 불러오는 중...</div>
            ) : deptFiles.length === 0 ? (
            <div className="fs_filelist_empty" style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: '#666',
                fontSize: '16.32px'
            }}>해당 부서의 파일이 없습니다.</div>
            ) : (
            getCurrentPageFiles().map((file, index) => (
                <div className="fs_filelist_row" key={`file-${file.file_idx || file.id || Date.now()}-${index}`} style={{
                    display: 'flex',
                    padding: '12px 16px',
                    borderBottom: '1px solid #eee',
                    alignItems: 'center',
                    fontSize: '16.32px'
                }}>
                <span 
                    style={{ 
                        flex: 2, 
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                    title={file.originalName || file.name}
                >
                    {file.originalName || file.name}
                </span>
                <span style={{ flex: 1, textAlign: 'center' }}>{file.uploader}</span>
                <span style={{ flex: 1, textAlign: 'center' }}>{formatSize(file.size)}</span>
                <span style={{ flex: 1, textAlign: 'center' }}>{file.uploadDate}</span>
                <span style={{ flex: 1, textAlign: 'center' }}>
                  {(() => {
                    const expireDate = getFileExpireDate(file.uploadDate);
                    const daysLeft = getDaysUntilExpire(file.uploadDate);
                    
                    if (daysLeft === null) return '-';
                    if (daysLeft < 0) return <span style={{ color: '#dc3545', fontWeight: 'bold' }}>만료됨</span>;
                    if (daysLeft <= 7) return <span style={{ color: '#ffc107', fontWeight: 'bold' }}>{expireDate} ({daysLeft}일)</span>;
                    return <span style={{ color: '#28a745' }}>{expireDate}</span>;
                  })()}
                </span>
                <span className="fs_download_btn" style={{ flex: 1, textAlign: 'center' }}>
                    {(() => {
                        const daysLeft = getDaysUntilExpire(file.uploadDate);
                        const isExpired = daysLeft !== null && daysLeft < 0;
                        
                        if (isExpired) {
                            return (
                                <button 
                                    style={{
                                        color: '#6c757d',
                                        background: 'none',
                                        border: 'none',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '16.32px',
                                        cursor: 'not-allowed',
                                        textDecoration: 'line-through'
                                    }}
                                    disabled
                                    title="만료된 파일은 다운로드할 수 없습니다"
                                >
                                    다운로드
                                </button>
                            );
                        }
                        
                        return (
                            <button 
                                style={{
                                    color: '#007bff',
                                    background: 'none',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '16.32px',
                                    cursor: 'pointer'
                                }}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    try {
                                        // 현재 사용자 ID 가져오기
                                        const userId = sessionStorage.getItem('userId');
                                        if (!userId) {
                                            alert('로그인이 필요합니다.');
                                            return;
                                        }

                                        const response = await fetch(`${apiUrl}/cloud/download/${file.file_idx || file.id}?user_id=${userId}`);
                                        
                                        if (response.ok) {
                                            // 파일 다운로드 처리 - Mac 호환성 개선
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = file.originalName || file.name;
                                            a.style.display = 'none';
                                            document.body.appendChild(a);
                                            
                                            // Mac Safari 호환성을 위한 처리
                                            try {
                                                a.click();
                                            } catch (error) {
                                                // click() 실패 시 대체 방법
                                                const event = new MouseEvent('click', {
                                                    view: window,
                                                    bubbles: true,
                                                    cancelable: true
                                                });
                                                a.dispatchEvent(event);
                                            }
                                            
                                            // 메모리 정리
                                            setTimeout(() => {
                                                window.URL.revokeObjectURL(url);
                                                if (document.body.contains(a)) {
                                                    document.body.removeChild(a);
                                                }
                                            }, 100);
                                        } else {
                                            alert('파일 다운로드에 실패했습니다.');
                                        }
                                    } catch (error) {
                                        console.error('다운로드 오류:', error);
                                        alert('파일 다운로드 중 오류가 발생했습니다.');
                                    }
                                }}
                            >
                                다운로드
                            </button>
                        );
                    })()}
                </span>
                <span style={{ flex: 1, textAlign: 'center' }}>
                    {canDeleteFile(file) ? (
                        <button 
                            className="fs_delete_btn" 
                            onClick={() => handleDelete(file.file_idx || file.id)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#dc3545',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '16.32px',
                                textDecoration: 'underline'
                            }}
                        >
                            삭제
                        </button>
                    ) : (
                        <span style={{ color: "#bbb", fontSize: '16.32px' }}>-</span>
                    )}
                </span>
                </div>
            ))
            )}
        </div>
        
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
                        key={`page-${idx + 1}-${Date.now()}`}
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
      
        
        {/* 링크 추가 폼 */}
        <div className="fs_link_section" style={{ marginBottom: '20px' }}>
            <div className="fs_link_head">링크 추가</div>
            <form className="fs_link_add_form" onSubmit={handleLinkAdd} style={{ 
                marginTop: 10,
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
            }}>
                <input
                    className="fs_input"
                    type="text"
                    placeholder="링크명"
                    value={link.title}
                    onChange={e => setLink({ ...link, title: e.target.value })}
                    style={{ width: 200, flexShrink: 0 }}
                />
                <input
                    className="fs_input"
                    type="text"
                    placeholder="url을 적어주세요."
                    value={link.url}
                    onChange={e => {
                        const inputValue = e.target.value;
                        // URL에 필요한 문자들 허용 (영어, 숫자, 점, 하이픈, 언더스코어, 슬래시, 콜론, 물음표, 등호, 앰퍼샌드)
                        const filteredValue = inputValue.replace(/[^a-zA-Z0-9./?=:&_-]/g, '');
                        
                        setLink({ ...link, url: filteredValue });
                    }}
                    style={{ flex: 1, minWidth: 0 }}
                />
                <button type="submit" className="fs_btn" disabled={!link.title || !link.url} style={{ flexShrink: 0 }}>
                    추가
                </button>
            </form>
        </div>

        {/* 외부 링크 공유 */}
        <div className="fs_link_section">
            <div className="fs_link_head">링크 공유</div>
            <div className="fs_link_list">
            {filteredLinks.length === 0 ? (
                <div className="fs_filelist_empty">등록된 외부 링크가 없습니다.</div>
            ) : (
                getCurrentPageLinks().map(link => (
                <div className="fs_link_row" key={`link-${link.link_idx}-${link.link_name}`} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: '1px solid #eee',
                    gap: '20px'
                }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <a 
                                className="fs_link_title" 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{
                                    color: '#007bff',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    display: 'inline-block'
                                }}
                            >
                                {link.link_name}
                            </a>
                        </div>
                        <span className="fs_link_uploader" style={{ 
                            fontSize: '14px', 
                            color: '#666',
                            marginTop: '2px'
                        }}>
                            {link.uploader_name || '알 수 없음'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {canEditLink(link) ? (
                            <>
                                <button 
                                    className="fs_edit_btn" 
                                    onClick={() => handleEditLink(link)}
                                    style={{
                                        background: 'none',
                                        border: '1px solid #007bff',
                                        color: '#007bff',
                                        cursor: 'pointer',
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}
                                >
                                    수정
                                </button>
                                <button 
                                    className="fs_delete_btn" 
                                    onClick={() => handleLinkDelete(link.link_idx)}
                                    style={{
                                        background: 'none',
                                        border: '1px solid #dc3545',
                                        color: '#dc3545',
                                        cursor: 'pointer',
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}
                                >
                                    삭제
                                </button>
                            </>
                        ) : (
                            <span style={{ color: "#bbb", fontSize: '14px' }}>-</span>
                        )}
                    </div>
                </div>
                ))
            )}
            </div>
            
            {/* 링크 페이징 */}
            {filteredLinks.length > 0 && (
                <div className="board_pagination" style={{ marginTop: '20px' }}>
                    <button
                        className="board_btn"
                        onClick={() => handleLinkPageChange(currentLinkPage - 1)}
                        disabled={currentLinkPage === 1}
                    >
                        이전
                    </button>
                    {[...Array(totalLinkPages)].map((_, idx) => (
                        <button
                            key={`link-page-${idx + 1}-${Date.now()}`}
                            className={`board_btn board_page_btn${currentLinkPage === idx + 1 ? " active" : ""}`}
                            onClick={() => handleLinkPageChange(idx + 1)}
                        >
                            {idx + 1}
                        </button>
                    ))}
                    <button
                        className="board_btn"
                        onClick={() => handleLinkPageChange(currentLinkPage + 1)}
                        disabled={currentLinkPage === totalLinkPages}
                    >
                        다음
                    </button>
                </div>
            )}
        </div>
        </div>
        
        {/* 링크 수정 모달 */}
        {showEditModal && editingLink && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              minWidth: '400px',
              maxWidth: '500px'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#333' }}>링크 수정</h3>
              <form onSubmit={handleUpdateLink}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    링크명:
                  </label>
                  <input
                    type="text"
                    value={editingLink.link_name}
                    onChange={(e) => setEditingLink({
                      ...editingLink,
                      link_name: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    URL:
                  </label>
                  <input
                    type="url"
                    value={editingLink.url}
                    onChange={(e) => setEditingLink({
                      ...editingLink,
                      url: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingLink(null);
                    }}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa',
                      cursor: 'pointer'
                    }}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    수정
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        <Footer/>
    </div>
  );
}
