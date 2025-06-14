// app/terms/page.tsx
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold mb-8">利用規約</h1>
        
        <p className="text-sm text-gray-600 mb-8">最終更新日: 2025年6月15日</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">第1条（本規約の適用）</h2>
          <p>
            本規約は、本サービス運営者（以下「当社」といいます）が提供する「JTAテニスランキング分析サービス」（以下「本サービス」といいます）の利用に関する条件を、本サービスを利用するお客様（以下「利用者」といいます）と当社との間で定めるものです。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">第2条（本サービスの内容）</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>本サービスは、公益財団法人日本テニス協会（以下「JTA」といいます）が公開するランキングデータを基に、独自の分析・可視化機能を提供するものです。</li>
            <li>
              本サービスは以下の機能を提供します：
              <ul className="list-disc pl-6 mt-2">
                <li>ランキングデータの閲覧・検索機能</li>
                <li>選手個人のランキング推移分析</li>
                <li>カテゴリ別統計情報の可視化</li>
                <li>データのグラフ表示機能</li>
              </ul>
            </li>
            <li>本サービスは、個人利用、教育目的、研究目的での利用を想定しています。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">第3条（データの取り扱い）</h2>
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <strong>データの出典</strong>
              <ul className="list-disc pl-6 mt-2">
                <li>本サービスで表示されるランキングデータは、JTA公式サイトで公開されている情報を基にしています。</li>
                <li>データの著作権その他の権利はJTAまたは権利者に帰属します。</li>
              </ul>
            </li>
            <li>
              <strong>データの正確性</strong>
              <ul className="list-disc pl-6 mt-2">
                <li>当社は、データの正確性について最大限の注意を払いますが、その完全性・正確性を保証するものではありません。</li>
                <li>正式なランキング情報については、JTA公式サイトをご確認ください。</li>
              </ul>
            </li>
            <li>
              <strong>データの利用制限</strong>
              <ul className="list-disc pl-6 mt-2">
                <li>利用者は、本サービスで取得したデータを商用目的で再配布、販売することはできません。</li>
                <li>データの二次利用については、JTAの規定に従うものとします。</li>
              </ul>
            </li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">第4条（利用者の責任）</h2>
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              利用者は、本サービスを以下の目的で利用することができます：
              <ul className="list-disc pl-6 mt-2">
                <li>個人的な情報収集・分析</li>
                <li>テニススクールやクラブ内での情報共有</li>
                <li>教育・研究目的での利用</li>
              </ul>
            </li>
            <li>
              利用者は、以下の行為を行ってはなりません：
              <ul className="list-disc pl-6 mt-2">
                <li>本サービスのデータを商用目的で転売・再配布すること</li>
                <li>自動化されたツール等による大量のデータ取得</li>
                <li>本サービスのシステムに過度な負荷をかける行為</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ul>
            </li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">第5条（有料オプション）</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>当社は、本サービスの一部機能を有料オプションとして提供する場合があります。</li>
            <li>
              有料オプションには以下が含まれる場合があります：
              <ul className="list-disc pl-6 mt-2">
                <li>高度な分析機能</li>
                <li>カスタムレポート作成</li>
                <li>データエクスポート機能（個人利用に限る）</li>
                <li>広告非表示</li>
              </ul>
            </li>
            <li>有料オプションの料金および支払い方法については、別途定めるものとします。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">第6条（知的財産権）</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>本サービスのシステム、デザイン、分析アルゴリズムに関する知的財産権は当社に帰属します。</li>
            <li>ランキングデータに関する権利はJTAまたは権利者に帰属し、当社はこれらの権利を主張しません。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">第7条（免責事項）</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>当社は、本サービスの利用により生じた直接的または間接的な損害について、一切の責任を負いません。</li>
            <li>当社は、本サービスの継続的な提供を保証するものではありません。</li>
            <li>JTAのデータ提供方針の変更により、本サービスの内容が変更または終了する可能性があります。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">第8条（サービスの変更・終了）</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>当社は、利用者への事前通知により、本サービスの内容を変更または終了することができます。</li>
            <li>緊急の場合は、事前通知なく変更・終了する場合があります。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">第9条（個人情報の取り扱い）</h2>
          <p>
            当社は、本サービスの提供にあたり取得した個人情報を、別途定める
            <Link href="/privacy" className="text-blue-600 hover:underline">プライバシーポリシー</Link>
            に従い適切に管理します。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">第10条（準拠法・管轄）</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>本規約は日本法に準拠します。</li>
            <li>本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">第11条（規約の変更）</h2>
          <p>
            当社は、必要に応じて本規約を変更することができます。変更後の規約は、本サービス上で公開した時点から効力を生じるものとします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">第12条（お問い合わせ）</h2>
          <p>本規約に関するお問い合わせは、以下の連絡先までお願いします。</p>
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="font-semibold">JTAテニスランキング分析サービス運営</p>
            <p>メールアドレス: contact@example.com</p>
          </div>
        </section>

        <div className="mt-12 pt-8 border-t">
          <h3 className="text-lg font-semibold mb-2">附則</h3>
          <p>本規約は2025年6月15日より施行します。</p>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-blue-600 hover:underline">
            ← トップページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}