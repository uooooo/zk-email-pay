import Link from "next/link";

export default function Home() {
  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold">zk-email-pay ダッシュボード</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="送金" href="/send" description="メール/EOA宛に送金（返信で実行）" />
        <Card title="クレーム" href="/claim" description="未請求の資産を受け取る" />
        <Card title="引き出し" href="/withdraw" description="外部アドレスに送金" />
        <Card title="アカウント" href="/account" description="作成/初期化・Relayer情報" />
      </div>
      <p className="text-xs text-gray-500">開発モードでは公開 Relayer API と公開コントラクトを参照できます。環境変数で切替。</p>
    </div>
  );
}

function Card({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href} className="block rounded border p-4 hover:bg-gray-50">
      <div className="font-medium">{title}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </Link>
  );
}
