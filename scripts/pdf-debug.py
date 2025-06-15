#!/usr/bin/env python3
"""
PDFの構造をデバッグするツール
使用方法: python3 pdf_debug.py <PDFファイル名> [ページ番号]
"""

import pdfplumber
import sys
import os

def debug_pdf_structure(pdf_path: str, target_page: int = None):
    """PDFの構造を詳細に表示"""
    
    with pdfplumber.open(pdf_path) as pdf:
        print(f"PDFファイル: {pdf_path}")
        print(f"総ページ数: {len(pdf.pages)}\n")
        
        # ページを処理
        pages_to_process = [target_page - 1] if target_page else range(len(pdf.pages))
        
        for page_num in pages_to_process:
            if page_num >= len(pdf.pages):
                print(f"エラー: ページ {page_num + 1} は存在しません")
                continue
                
            page = pdf.pages[page_num]
            print(f"{'='*80}")
            print(f"ページ {page_num + 1}")
            print(f"{'='*80}\n")
            
            # 1. extract_text()の結果
            print("【extract_text()の結果】")
            text = page.extract_text()
            if text:
                lines = text.split('\n')
                # 男子シングルス35歳以上を含むページの場合、詳細を表示
                if any('35歳以上' in line for line in lines):
                    print(">>> 男子シングルス35歳以上のページを発見! <<<\n")
                    for i, line in enumerate(lines[:50]):  # 最初の50行
                        print(f"{i:3d}: {repr(line)}")
                else:
                    # それ以外は最初の10行のみ
                    for i, line in enumerate(lines[:10]):
                        print(f"{i:3d}: {repr(line)}")
            else:
                print("テキストが抽出できませんでした")
            
            print("\n" + "-"*80 + "\n")
            
            # 2. extract_words()の結果（選手情報がある場合）
            if text and '35歳以上' in text:
                print("【extract_words()の結果（y座標でソート）】")
                words = page.extract_words(
                    x_tolerance=3,
                    y_tolerance=3,
                    keep_blank_chars=True,
                    use_text_flow=True
                )
                
                # y座標でグループ化
                from collections import defaultdict
                lines_by_y = defaultdict(list)
                
                for word in words[:100]:  # 最初の100単語
                    y = round(word['top'])  # y座標を丸める
                    lines_by_y[y].append(word)
                
                # y座標順に表示
                for y in sorted(lines_by_y.keys())[:30]:  # 最初の30行
                    line_words = sorted(lines_by_y[y], key=lambda w: w['x0'])
                    line_text = ' '.join([w['text'] for w in line_words])
                    print(f"Y={y:3d}: {line_text}")
            
            print("\n" + "-"*80 + "\n")
            
            # 3. extract_table()の結果（もしテーブルがあれば）
            print("【extract_table()の結果】")
            tables = page.extract_tables()
            if tables:
                for i, table in enumerate(tables):
                    print(f"テーブル {i + 1}:")
                    for row in table[:10]:  # 最初の10行
                        print(f"  {row}")
            else:
                print("テーブルは検出されませんでした")

def main():
    """メイン処理"""
    if len(sys.argv) < 2:
        print("使用方法: python3 pdf_debug.py <PDFファイル名> [ページ番号]")
        print("例: python3 pdf_debug.py result_1005226.pdf")
        print("例: python3 pdf_debug.py result_1005226.pdf 1")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    target_page = int(sys.argv[2]) if len(sys.argv) > 2 else None
    
    if not os.path.exists(pdf_path):
        print(f"エラー: ファイル '{pdf_path}' が見つかりません")
        sys.exit(1)
    
    try:
        debug_pdf_structure(pdf_path, target_page)
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()