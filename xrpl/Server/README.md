### 📄 serverInfo.ts

---
## 목적
Devnet 노드의 서버 상태 및 활성화된 기능(Amendment) 목록을 확인하는 유틸리티 스크립트.

---
## 설명

1. XRPL WebSocket(wss://s.devnet.rippletest.net:51233)에 연결

2. server_info 명령으로 rippled 버전 조회

3. feature 명령으로 현재 노드에서 활성화된 amendment 목록 조회

4. 결과를 콘솔에 출력

* 디버깅, 기능 지원 여부 확인용 


