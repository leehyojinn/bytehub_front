'use client';

import Footer from "@/app/Footer";
import Header from "@/app/Header";
import React, { useState, useEffect } from "react";

const teams = [
  { id: 1, name: "프론트엔드" },
  { id: 2, name: "백엔드" },
  { id: 3, name: "디자인팀" },
];

const folderPermissions = [
  { id: 1, team_id: 1, name: "프론트엔드 파일함", permission: "읽기,쓰기,공유" },
  { id: 2, team_id: 2, name: "백엔드 파일함", permission: "읽기,쓰기" },
  { id: 3, team_id: null, name: "공용 파일함", permission: "읽기,공유" }, // 전체 사원
];

const initialFiles = [
  { id: 1, folder_id: 1, name: "FE_기획서.pdf", uploader: "김부장", size: 1024 * 1024, uploadDate: "2025-06-25", expireDate: "2025-07-10", url: "#", teamOnly: true },
  { id: 2, folder_id: 3, name: "공용_디자인.png", uploader: "박팀장", size: 2 * 1024 * 1024, uploadDate: "2025-06-26", expireDate: "2025-07-30", url: "#", teamOnly: false }
];

const initialLinks = [
  { id: 1, folder_id: 1, title: "Figma 디자인", url: "https://figma.com", expireDate: "2025-07-15" }
];

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
  const [links, setLinks] = useState(initialLinks);
  const [isLoading, setIsLoading] = useState(false);
  
  // 페이징 관련 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // 페이지당 파일 수

  // 업로드 폼
  const [upload, setUpload] = useState({ files: [] });
  // 외부 링크 폼
  const [link, setLink] = useState({ title: "", url: "", expireDate: "" });

  // 사용자 정보 가져오기
  const fetchUserInfo = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.error('토큰이 없습니다.');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
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
          console.log('사용자 정보:', result.data);
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
      const response = await fetch(`${apiUrl}/cloud/list?deptIdx=${deptIdx}`);
      
      if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const fileList = result.data.map((file, index) => {
              console.log('개별 파일 데이터:', file);
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
          const errorText = await response.text();
          console.error('에러 응답:', errorText);
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
    }
  }, [selectedDeptIdx]);

  // 파일 업로드
  const handleFileChange = e => {
    const selectedFiles = Array.from(e.target.files);
    const oversizedFiles = selectedFiles.filter(file => file.size > 10 * 1024 * 1024);
    const validFiles = selectedFiles.filter(file => file.size <= 10 * 1024 * 1024);
    
    // 10mMB 초과 파일이 있으면 한 번에 알림
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(file => file.name).join(', ');
      alert(`다음 파일들은 100MB를 초과하여 제외됩니다:\n${fileNames}`);
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
          formData.append('userId', userId);
          formData.append('expireDate', new Date().toISOString().slice(0, 10)); // 현재 날짜를 만료일로 설정

          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
      const response = await fetch(`${apiUrl}/cloud/delete/${id}`, {
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
  const handleLinkAdd = e => {
    e.preventDefault();
    if (!link.title || !link.url || !link.expireDate) return;
    setLinks([
      ...links,
      {
        id: Date.now(),
        folder_id: selectedDeptIdx,
        title: link.title,
        url: link.url,
        expireDate: link.expireDate
      }
    ]);
    setLink({ title: "", url: "", expireDate: "" });
  };
  // 외부 링크 삭제
  const handleLinkDelete = id => {
    setLinks(links.filter(l => l.id !== id));
  };

  // 30일이 지난 파일을 필터링하는 함수
  const isFileExpired = (uploadDate) => {
    if (!uploadDate) return false;
    const uploadTime = new Date(uploadDate).getTime();
    const currentTime = new Date().getTime();
    const thirtyOneDaysInMs = 30 * 24 * 60 * 60 * 1000; // 30일을 밀리초로
    return (currentTime - uploadTime) > thirtyOneDaysInMs;
  };

  // 파일의 만료일을 계산하는 함수
  const getFileExpireDate = (uploadDate) => {
    if (!uploadDate) return '';
    const uploadTime = new Date(uploadDate);
    const expireTime = new Date(uploadTime.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30일 후
    return expireTime.toISOString().slice(0, 10);
  };

  // 만료일까지 남은 일수를 계산하는 함수
  const getDaysUntilExpire = (uploadDate) => {
    if (!uploadDate) return null;
    const uploadTime = new Date(uploadDate);
    const expireTime = new Date(uploadTime.getTime() + (31 * 24 * 60 * 60 * 1000));
    const currentTime = new Date();
    const diffTime = expireTime.getTime() - currentTime.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // 현재 부서 파일/링크만 표시 (숫자 타입으로 일관되게 처리)
  const deptFiles = files
    .filter(f => Number(f.folder_id) === Number(selectedDeptIdx));
  const deptLinks = links.filter(l => Number(l.folder_id) === Number(selectedDeptIdx));

  // 페이징 관련 함수들
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 현재 페이지의 파일들만 표시
  const getCurrentPageFiles = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return deptFiles.slice(startIndex, endIndex);
  };

  // 전체 페이지 수 계산
  const totalPages = Math.ceil(deptFiles.length / pageSize);
  


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
              key={dept.dept_idx}
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
                        <div key={index} style={{
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
            overflow: 'hidden'
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
                <div className="fs_filelist_row" key={`${file.id}-${index}`} style={{
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

                                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
                                        const response = await fetch(`${apiUrl}/cloud/download/${file.id}?userId=${userId}`);
                                        
                                        if (response.ok) {
                                            // 파일 다운로드 처리
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = file.originalName || file.name;
                                            document.body.appendChild(a);
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                            document.body.removeChild(a);
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
                            onClick={() => handleDelete(file.id)}
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
                        key={idx + 1}
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
      
        
        {/* 외부 링크 공유 */}
        <div className="fs_link_section">
            <div className="fs_link_head">외부 링크 공유</div>
            <div className="fs_link_list">
            {deptLinks.length === 0 ? (
                <div className="fs_filelist_empty">등록된 외부 링크가 없습니다.</div>
            ) : (
                deptLinks.map(link => (
                <div className="fs_link_row" key={link.id}>
                    <span className="fs_link_title">{link.title}</span>
                    <a className="fs_link_url" href={link.url} target="_blank" rel="noopener noreferrer">바로가기</a>
                    <span className="fs_link_expire">{link.expireDate}</span>
                    <button className="fs_delete_btn" onClick={() => handleLinkDelete(link.id)}>삭제</button>
                </div>
                ))
            )}
            </div>
            {/* 링크 추가 */}
            <form className="fs_link_add_form" onSubmit={handleLinkAdd} style={{ marginTop: 10 }}>
            <input
                className="fs_input"
                type="text"
                placeholder="링크명"
                value={link.title}
                onChange={e => setLink({ ...link, title: e.target.value })}
                style={{ width: 120, marginRight: 8 }}
            />
            <input
                className="fs_input"
                type="url"
                placeholder="https://"
                value={link.url}
                onChange={e => setLink({ ...link, url: e.target.value })}
                style={{ width: 210, marginRight: 8 }}
            />
            <input
                className="fs_input"
                type="date"
                value={link.expireDate}
                onChange={e => setLink({ ...link, expireDate: e.target.value })}
                style={{ width: 140, marginRight: 8 }}
            />
            <button type="submit" className="fs_btn" disabled={!link.title || !link.url || !link.expireDate}>추가</button>
            </form>
        </div>
        </div>
        <Footer/>
    </div>
  );
}
