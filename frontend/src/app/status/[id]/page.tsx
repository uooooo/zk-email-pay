import React from "react";

export default function StatusPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">ステータス</h1>
      <div className="space-y-2 text-sm">
        <p>リクエスト ID: <span className="font-mono">{id}</span></p>
        <p>Relayer から届く確認メールに返信すると実行されます。完了後、結果メールが送付されます。</p>
        <p className="text-gray-500">このページは参考表示です（ステータス API 提供なし）。</p>
      </div>
    </div>
  );
}

