了解！**Japan Smart Chain (JSC) バウンティ**を“何を作ればよいか／どう提出するか／どう評価されるか”まで一気に把握できる形で噛み砕いてまとめます。

# 🔷 JSC バウンティ徹底ガイド

## ① どんなバウンティ？

* **テーマ**：Mizuhiki Verified SBT を使ったアプリ開発（JSCのKaiganテストネットで必須）([Japan Smart Chain][1])
* **トラック & 賞金**

  * **Privacy-Preserving DeFi**：🥇 **US\$1,500** ([Japan Smart Chain][1])
  * **Ticketing（体験重視）**：🥇 **US\$1,500** ([Japan Smart Chain][1])
  * **特別賞**（ユニークアイデア）：💎 **US\$500** ([Japan Smart Chain][1])
* **副賞的チャンス**：**JSCの創業者・投資家への直接ピッチ機会**（商用化への足がかり）([Japan Smart Chain][1])

## ② 必須要件（使うもの／提出物）

* **コア要件**：JSC Kaigan で **Mizuhiki Verified SBT** を統合（規制準拠・ロイヤルティ/チケ用途のどちらでもOK）([Japan Smart Chain][1])
* **提出パッケージ（48時間以内）**：

  1. **GitHub**（コントラクト、スクリプト、フロント、テスト、ドキュメント）
  2. **README**（要約、SBTの使い方、セットアップ/テスト手順、**≤3分の動画リンク**またはスライド、次の一手）
  3. **チーム要約**（メンバーと役割） ([Japan Smart Chain][1])
* **デモ提示**：**3分以内の動画** or **当日ライブ発表**のいずれか必須 ([Japan Smart Chain][1])
* **失格条件**：SBT未使用／GitHub+README+デモ+チーム要約の欠落／締切ミス ([Japan Smart Chain][1])

## ③ 審査基準（配点）

### A. Privacy-Preserving DeFi（例：SCA + SBTゲーティング、Privacy Pools 等）

* 完成度（E2E動作・セットアップ）**20%**
* 先端暗号（ZKP/FHE等）での**堅牢性・速度・簡潔性**の改善 **20%**
* **UX**（オンボーディング/継続利用/非エンジニアへの易しさ）**40%**
* **実用性**（規制課題の解決 × web3連携）**20%** ([Japan Smart Chain][1])

**参考アイデア**：
SBTを紐づけた**スマートアカウント**、**Privacy Pools**（額・送受信の秘匿）、給与/貿易金融/AMM連携など。関連資料も提示あり。([Japan Smart Chain][1])

### B. Ticketing（偽券・転売・高手数料などの課題に挑む）

* 完成度 **20%**／**革新的なUI/表現** **20%**／**UX** **40%**／**実用性** **20%**
* 例：**転売制限（価格上限）**、**二重使用防止（移転でQR/バーコード更新）**、**ファン特典解錠**、**安価で即時性ある決済**、**オフライン検証** 等。([Japan Smart Chain][1])

## ④ 参加〜提出の実務フロー（超実践）

1. **Kaiganテストネット申請**（フォーム）：RPCやアクセスのため登録。
   → *Japan Smart Chain Testnet Access Request*（Google Form）([Google Docs][2])
2. **SBTの発行申請**：自分の**EVMアドレス**を送ってKaigan上でSBT受領。
   → *Mizuhiki Verified SBT Request*（Google Form）([Google Docs][3])
3. **開発**：SBTを**アプリの権限/許可/ルール**に組み込み（DeFi または Ticketing）。
4. **提出物整備**：GitHub一式／README（動画≤3分 or スライド必須）／チーム要約。([Japan Smart Chain][1])
5. **締切**：ETHTokyo側の提出期限に従う（例：**9/15 01:00頃** 表示あり）。詳細はハッカソンプラットフォームで確認。([Taikai][4])

## ⑤ スコア最大化のコツ（実戦TIPs）

* **“UX 40%”が最重**：初回起動から実取引/入場まで“迷わない”導線・文言・空振りゼロの体験を作る（DeFi/Ticketing共通）。([Japan Smart Chain][1])
* **規制×プライバシーの両立**：

  * SBTで**KYC済みのみ**許可（コントラクト/フロント双方でガード）。
  * **金額・相手先の秘匿**（プライバシープール or ノート構造）を明示。([Japan Smart Chain][1])
* **READMEは“再現性主義”**：`git clone→.env→デプロイ→E2Eテスト`まで**人手なし**で通る手順を書く（採点の土台＝完成度20%）。([Japan Smart Chain][1])
* **3分動画**：機能全部より**価値の瞬間**（例：KYC→許可→秘匿送金/入場）に集中。([Japan Smart Chain][1])
* **失格回避チェック**：SBT連携の証跡、提出3点セット、締切時刻を**最優先**で管理。([Japan Smart Chain][1])

## ⑥ 公開情報＆連絡先

* バウンティ詳細（公式ランディング）([Japan Smart Chain][1])
* **テストネット申請フォーム**（Kaigan）([Google Docs][2])
* **SBT発行リクエストフォーム**（Kaigan）([Google Docs][3])
* **問い合わせ**：[developers@japansmartchain.com](mailto:developers@japansmartchain.com)（Kaiganアクセス相談）([Japan Smart Chain][1])

---

必要なら、\*\*READMEの雛形（コピペで使えるやつ）\*\*と、\*\*SBTゲートの最小実装サンプル（Solidity+Front）\*\*をこのまま用意します。欲しいトラック（DeFi / Ticketing）を教えてください。

[1]: https://japansmartchain.com/en/landings/eth-tokyo-2025 "ETHTokyo 2025 | Japan Smart Chain"
[2]: https://docs.google.com/forms/d/e/1FAIpQLScWuTh2TAITjUpnUHoA_9NpyU_Mfmj0-JqDw0nOl3BS6JC6YQ/viewform?usp=header "Japan Smart Chain Testnet Access Request"
[3]: https://docs.google.com/forms/d/e/1FAIpQLSfG_LrEdfGwvBSmfsi612RNrsDtFfdwjdzhpSxI5KhVqpJOCQ/viewform "Mizuhiki Verified SBT Request"
[4]: https://taikai.network/en/ethtokyo/hackathons/hackathon-2025/prizes?utm_source=chatgpt.com "ETHTokyo 2025 hackathon"
