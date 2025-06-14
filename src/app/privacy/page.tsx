// app/privacy/page.tsx
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>
        
        <p className="text-sm text-gray-600 mb-8">最終更新日: 2025年6月15日</p>

        <p className="mb-6">
          本サービス運営者（以下「当社」といいます）は、JTAテニスランキング分析サービス（以下「本サービス」といいます）における利用者の個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. 収集する情報</h2>
          
          <h3 className="text-xl font-semibold mb-2">1.1 利用者が提供する情報</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>アカウント登録時：メールアドレス、ユーザー名</li>
            <li>有料オプション利用時：決済に必要な情報</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">1.2 自動的に収集される情報</h3>
          <ul className="list-disc pl-6">
            <li>アクセスログ（IPアドレス、ブラウザ情報、アクセス日時）</li>
            <li>Cookie情報</li>
            <li>本サービスの利用状況</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. 情報の利用目的</h2>
          <p>収集した情報は、以下の目的で利用します：</p>
          <ol className="list-decimal pl-6 mt-2">
            <li>本サービスの提供・運営</li>
            <li>利用者からのお問い合わせへの対応</li>
            <li>サービスの改善・新機能の開発</li>
            <li>統計データの作成（個人を特定できない形式）</li>
            <li>有料オプションの決済処理</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. 情報の第三者提供</h2>
          <p>当社は、以下の場合を除き、個人情報を第三者に提供しません：</p>
          <ol className="list-decimal pl-6 mt-2">
            <li>利用者の同意がある場合</li>
            <li>法令に基づく開示請求がある場合</li>
            <li>人の生命、身体または財産の保護のために必要な場合</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. 情報の管理</h2>
          <ol className="list-decimal pl-6">
            <li>当社は、個人情報の漏洩、滅失、毀損の防止のため、適切な安全管理措置を講じます。</li>
            <li>個人情報は、利用目的の達成に必要な期間のみ保管し、不要になった場合は速やかに削除します。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Cookieの使用</h2>
          <p>
            本サービスでは、利便性向上のためCookieを使用しています。利用者は、ブラウザの設定によりCookieを無効にすることができますが、一部の機能が利用できなくなる場合があります。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. 外部サービスの利用</h2>
          <p>本サービスでは、以下の外部サービスを利用する場合があります：</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Google Analytics（アクセス解析）</li>
            <li>決済サービス（有料オプション利用時）</li>
          </ul>
          <p className="mt-2">
            これらのサービスにおける情報の取り扱いは、各サービスのプライバシーポリシーに従います。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. 児童のプライバシー</h2>
          <p>
            本サービスは、13歳未満の児童からの個人情報を意図的に収集しません。13歳未満の方は、保護者の同意を得た上でご利用ください。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. 個人情報の開示・訂正・削除</h2>
          <p>
            利用者は、当社が保有する自己の個人情報について、開示・訂正・削除を請求することができます。請求方法については、お問い合わせ窓口までご連絡ください。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. プライバシーポリシーの変更</h2>
          <p>
            当社は、必要に応じて本ポリシーを変更することがあります。重要な変更がある場合は、本サービス上で通知します。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. お問い合わせ</h2>
          <p>個人情報の取り扱いに関するお問い合わせは、以下までお願いします。</p>
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="font-semibold">JTAテニスランキング分析サービス運営</p>
            <p>メールアドレス: privacy@example.com</p>
          </div>
        </section>

        <div className="mt-8">
          <Link href="/" className="text-blue-600 hover:underline">
            ← トップページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}