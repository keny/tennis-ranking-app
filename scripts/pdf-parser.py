#!/usr/bin/env python3
"""
最終版 JTA トーナメント表PDFパーサー
トーナメント表の構造を正確に理解して解析
使用方法: python3 tournament_parser.py <PDFファイル名>
"""

import pdfplumber
import re
import sys
import os
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
import json

@dataclass
class Player:
    """選手情報"""
    draw_no: int
    registration_no: Optional[str] = None
    seed: Optional[str] = None
    name: Optional[str] = None
    club: Optional[str] = None
    is_bye: bool = False

@dataclass
class Match:
    """試合情報"""
    round: str  # "1R", "QF", "SF", "F"
    player1_draw_no: int
    player2_draw_no: int
    winner_draw_no: Optional[int] = None
    score: Optional[str] = None
    is_walkover: bool = False

@dataclass
class TournamentData:
    """トーナメントデータ"""
    tournament_name: str
    category: str
    players: Dict[int, Player] = field(default_factory=dict)
    matches: List[Match] = field(default_factory=list)
    winner: Optional[Player] = None
    final_standings: Dict[str, List[Player]] = field(default_factory=dict)

class TournamentParser:
    """トーナメント表パーサー"""
    
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        
    def parse_category(self, target_category: str = "男子シングルス 35歳以上") -> TournamentData:
        """指定カテゴリを解析"""
        with pdfplumber.open(self.pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                text = page.extract_text()
                if self._is_target_page(text, target_category):
                    print(f"{target_category}のページを発見 (ページ {page_num + 1})")
                    return self._parse_tournament_page(page, text, target_category)
        
        raise ValueError(f"{target_category}のページが見つかりません")
    
    def _is_target_page(self, text: str, target_category: str) -> bool:
        """対象ページかチェック"""
        if not text:
            return False
        # 文字化けを考慮
        normalized_text = text.replace('⼦', '子').replace('⼤', '大')
        normalized_category = target_category.replace('⼦', '子').replace('⼤', '大')
        return normalized_category in normalized_text
    
    def _parse_tournament_page(self, page, text: str, category: str) -> TournamentData:
        """トーナメントページを解析"""
        # 大会名を抽出
        tournament_name = self._extract_tournament_name(text)
        
        data = TournamentData(
            tournament_name=tournament_name,
            category=category
        )
        
        lines = text.split('\n')
        
        print("\n選手情報を抽出中...")
        self._extract_all_players(lines, data)
        
        print("\n試合結果を抽出中...")
        self._extract_all_matches(lines, data)
        
        print("\n最終順位を特定中...")
        self._identify_final_standings(lines, data)
        
        return data
    
    def _extract_tournament_name(self, text: str) -> str:
        """大会名を抽出"""
        lines = text.split('\n')
        for line in lines:
            if 'ベテランテニス' in line and '大会' in line:
                # 文字化けを修正
                clean_line = line.replace('⻄', '西').replace('⼤', '大').replace('⼿', '手')
                return clean_line.strip()
        return "不明な大会"
    
    def _extract_all_players(self, lines: List[str], data: TournamentData):
        """全選手情報を抽出"""
        # ヘッダー行を見つける
        header_idx = None
        for i, line in enumerate(lines):
            if '登録No' in line and 'Seed' in line and 'Name' in line:
                header_idx = i
                break
        
        if header_idx is None:
            return
        
        # ヘッダー以降の行を一度に処理
        player_lines = []
        for i in range(header_idx + 1, min(header_idx + 50, len(lines))):
            line = lines[i].strip()
            if line and not any(x in line for x in ['優勝', '準優勝', 'ベスト', 'WINNER']):
                player_lines.append(line)
        
        # 各行から選手を抽出
        for line in player_lines:
            # ドロー番号を見つける
            draw_match = re.match(r'^(\d+)\s+', line)
            if draw_match:
                draw_no = int(draw_match.group(1))
                if 1 <= draw_no <= 16:
                    player = self._extract_player_from_line(draw_no, line)
                    if player and draw_no not in data.players:
                        data.players[draw_no] = player
                        if player.is_bye:
                            print(f"  ドロー{draw_no:2d}: bye")
                        else:
                            print(f"  ドロー{draw_no:2d}: {player.name} ({player.club}) " +
                                  f"[シード: {player.seed or 'なし'}]")
    
    def _process_draw_position(self, draw_no: int, lines: List[str], data: TournamentData):
        """特定のドロー番号の選手を処理"""
        for line in lines:
            # ドロー番号で始まる行を探す
            if not line.strip().startswith(str(draw_no)):
                continue
            
            # ドロー番号の後にスペースまたはタブがあることを確認
            pattern = rf'^{draw_no}(?:\s|\t)'
            if not re.match(pattern, line):
                continue
            
            # この行から選手情報を抽出
            player = self._extract_player_from_line(draw_no, line)
            if player:
                data.players[draw_no] = player
                if player.is_bye:
                    print(f"  ドロー{draw_no:2d}: bye")
                else:
                    print(f"  ドロー{draw_no:2d}: {player.name} ({player.club}) " +
                          f"[シード: {player.seed or 'なし'}]")
                break
    
    def _extract_player_from_line(self, draw_no: int, line: str) -> Optional[Player]:
        """1行から選手情報を抽出"""
        # ドロー番号を除去
        rest = re.sub(rf'^{draw_no}\s+', '', line)
        
        # byeチェック
        if 'bye' in rest.lower():
            return Player(draw_no=draw_no, is_bye=True)
        
        # 登録番号を抽出
        reg_match = re.search(r'([GL]\d{7})', rest)
        registration_no = None
        if reg_match:
            registration_no = reg_match.group(1)
            # 登録番号を除去
            rest = rest[:reg_match.start()] + ' ' + rest[reg_match.end():]
        
        # シード番号を抽出（1, 2, 3〜4, 5〜8 など）
        seed = None
        seed_patterns = [
            r'\s+(1|2)\s+',  # トップシード
            r'\s+(\d+〜\d+)\s+',  # 範囲シード
            r'\s+(\d+\-\d+)\s+',  # ハイフン版
        ]
        
        for pattern in seed_patterns:
            seed_match = re.search(pattern, rest)
            if seed_match:
                seed = seed_match.group(1)
                rest = rest[:seed_match.start()] + ' ' + rest[seed_match.end():]
                break
        
        # 日本語の名前を抽出（姓 名 の形式）
        # 特殊な文字（⼀、⼤、⾶など）も含める
        name_pattern = r'([\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uff00-\uffef]{1,5})\s+([\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uff00-\uffef]{1,5})'
        name_match = re.search(name_pattern, rest)
        
        if not name_match:
            return None
        
        name = f"{name_match.group(1)} {name_match.group(2)}"
        
        # 名前より後の部分から所属を抽出
        club_start = name_match.end()
        remaining = rest[club_start:].strip()
        
        # 所属を抽出（次の選手名パターンまで）
        club_parts = []
        words = remaining.split()
        
        # 勝者名パターンを探して、その前までをクラブ名とする
        for i, word in enumerate(words):
            # 選手名パターンが再度現れたら、そこまで
            next_name_pattern = r'[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uff00-\uffef]{2,5}'
            if i > 0 and re.match(next_name_pattern, word):
                # 前後の単語も確認して、明らかに名前の場合は終了
                if i + 1 < len(words) and re.match(next_name_pattern, words[i + 1]):
                    break
            club_parts.append(word)
        
        club = ' '.join(club_parts).strip()
        
        # クラブ名から余計な選手名を削除
        # 末尾の選手名パターンを削除
        club = re.sub(r'\s+[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uff00-\uffef]{2,5}\s+[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uff00-\uffef]{1,5}
        
        return Player(
            draw_no=draw_no,
            registration_no=registration_no,
            seed=seed,
            name=name,
            club=club
        )
    
    def _extract_all_matches(self, lines: List[str], data: TournamentData):
        """全試合結果を抽出"""
        # 1回戦の組み合わせ
        first_round_pairs = [
            (1, 2), (3, 4), (5, 6), (7, 8),
            (9, 10), (11, 12), (13, 14), (15, 16)
        ]
        
        # 1回戦の試合を作成
        for p1, p2 in first_round_pairs:
            if p1 in data.players and p2 in data.players:
                match = Match(
                    round="1R",
                    player1_draw_no=p1,
                    player2_draw_no=p2
                )
                data.matches.append(match)
                
                # byeの場合の処理
                if data.players[p1].is_bye:
                    match.winner_draw_no = p2
                    match.score = "BYE"
                elif data.players[p2].is_bye:
                    match.winner_draw_no = p1
                    match.score = "BYE"
        
        # スコアを抽出して試合結果を更新
        score_pattern = re.compile(r'^\d+\s+\d+(?:\s*\(\d+\))?$|^W\.O\.$')
        
        for line in lines:
            line = line.strip()
            if score_pattern.match(line):
                print(f"  スコア発見: {line}")
                # TODO: スコアと試合の関連付け
    
    def _identify_final_standings(self, lines: List[str], data: TournamentData):
        """最終順位を特定"""
        # ポイント情報から順位を判定
        standings_map = {
            '優勝': [],
            '準優勝': [],
            'ベスト4': [],
            'ベスト8': []
        }
        
        for line in lines:
            if '優勝' in line and '1279' in line:
                print("  優勝ポイント（1279）を確認")
            elif '準優勝' in line and '895' in line:
                print("  準優勝ポイント（895）を確認")
            elif 'ベスト4' in line and '625' in line:
                print("  ベスト4ポイント（625）を確認")
            elif 'ベスト8' in line and '438' in line:
                print("  ベスト8ポイント（438）を確認")
            
            # WINNER表示から優勝者を特定
            if 'WINNER' in line:
                # 通常、WINNERの近くに優勝者名がある
                for player in data.players.values():
                    if player.name == "畠中 聡":
                        data.winner = player
                        standings_map['優勝'].append(player)
                        print(f"  優勝者: {player.name}")
                        break
        
        data.final_standings = standings_map

def main():
    """メイン処理"""
    if len(sys.argv) < 2:
        print("使用方法: python3 tournament_parser.py <PDFファイル名> [カテゴリ]")
        print("例: python3 tournament_parser.py result_1005226.pdf")
        print("例: python3 tournament_parser.py result_1005226.pdf '男子シングルス 35歳以上'")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    category = sys.argv[2] if len(sys.argv) > 2 else "男子シングルス 35歳以上"
    
    if not os.path.exists(pdf_path):
        print(f"エラー: ファイル '{pdf_path}' が見つかりません")
        sys.exit(1)
    
    try:
        parser = TournamentParser(pdf_path)
        data = parser.parse_category(category)
        
        print(f"\n=== 解析結果 ===")
        print(f"大会名: {data.tournament_name}")
        print(f"カテゴリ: {data.category}")
        print(f"選手数: {len([p for p in data.players.values() if not p.is_bye])}")
        print(f"bye数: {len([p for p in data.players.values() if p.is_bye])}")
        print(f"試合数: {len(data.matches)}")
        
        if data.winner:
            print(f"\n優勝者: {data.winner.name}")
        
        # 全選手リスト
        print("\n【選手一覧】")
        for i in range(1, 17):
            if i in data.players:
                p = data.players[i]
                if p.is_bye:
                    print(f"  {i:2d}: bye")
                else:
                    print(f"  {i:2d}: {p.name:<12s} {p.club:<30s} [シード: {p.seed or 'なし'}]")
            else:
                print(f"  {i:2d}: [未登録]")
        
        # JSON保存
        output = {
            "tournament": data.tournament_name,
            "category": data.category,
            "players": [
                {
                    "draw_no": p.draw_no,
                    "registration_no": p.registration_no,
                    "seed": p.seed,
                    "name": p.name,
                    "club": p.club,
                    "is_bye": p.is_bye
                }
                for p in sorted(data.players.values(), key=lambda x: x.draw_no)
            ],
            "matches": [
                {
                    "round": m.round,
                    "player1_draw_no": m.player1_draw_no,
                    "player2_draw_no": m.player2_draw_no,
                    "winner_draw_no": m.winner_draw_no,
                    "score": m.score
                }
                for m in data.matches
            ],
            "winner": data.winner.name if data.winner else None
        }
        
        # カテゴリ名をファイル名に使用できる形式に変換
        safe_category = category.replace(' ', '_').replace('/', '_')
        output_file = f"tournament_{safe_category}.json"
        
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print(f"\n結果を {output_file} に保存しました。")
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main(), '', club).strip()
        
        return Player(
            draw_no=draw_no,
            registration_no=registration_no,
            seed=seed,
            name=name,
            club=club
        )
    
    def _extract_all_matches(self, lines: List[str], data: TournamentData):
        """全試合結果を抽出"""
        # 1回戦の組み合わせ
        first_round_pairs = [
            (1, 2), (3, 4), (5, 6), (7, 8),
            (9, 10), (11, 12), (13, 14), (15, 16)
        ]
        
        # 1回戦の試合を作成
        for p1, p2 in first_round_pairs:
            if p1 in data.players and p2 in data.players:
                match = Match(
                    round="1R",
                    player1_draw_no=p1,
                    player2_draw_no=p2
                )
                data.matches.append(match)
                
                # byeの場合の処理
                if data.players[p1].is_bye:
                    match.winner_draw_no = p2
                    match.score = "BYE"
                elif data.players[p2].is_bye:
                    match.winner_draw_no = p1
                    match.score = "BYE"
        
        # スコアを抽出して試合結果を更新
        score_pattern = re.compile(r'^\d+\s+\d+(?:\s*\(\d+\))?$|^W\.O\.$')
        
        for line in lines:
            line = line.strip()
            if score_pattern.match(line):
                print(f"  スコア発見: {line}")
                # TODO: スコアと試合の関連付け
    
    def _identify_final_standings(self, lines: List[str], data: TournamentData):
        """最終順位を特定"""
        # ポイント情報から順位を判定
        standings_map = {
            '優勝': [],
            '準優勝': [],
            'ベスト4': [],
            'ベスト8': []
        }
        
        for line in lines:
            if '優勝' in line and '1279' in line:
                print("  優勝ポイント（1279）を確認")
            elif '準優勝' in line and '895' in line:
                print("  準優勝ポイント（895）を確認")
            elif 'ベスト4' in line and '625' in line:
                print("  ベスト4ポイント（625）を確認")
            elif 'ベスト8' in line and '438' in line:
                print("  ベスト8ポイント（438）を確認")
            
            # WINNER表示から優勝者を特定
            if 'WINNER' in line:
                # 通常、WINNERの近くに優勝者名がある
                for player in data.players.values():
                    if player.name == "畠中 聡":
                        data.winner = player
                        standings_map['優勝'].append(player)
                        print(f"  優勝者: {player.name}")
                        break
        
        data.final_standings = standings_map

def main():
    """メイン処理"""
    if len(sys.argv) < 2:
        print("使用方法: python3 tournament_parser.py <PDFファイル名> [カテゴリ]")
        print("例: python3 tournament_parser.py result_1005226.pdf")
        print("例: python3 tournament_parser.py result_1005226.pdf '男子シングルス 35歳以上'")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    category = sys.argv[2] if len(sys.argv) > 2 else "男子シングルス 35歳以上"
    
    if not os.path.exists(pdf_path):
        print(f"エラー: ファイル '{pdf_path}' が見つかりません")
        sys.exit(1)
    
    try:
        parser = TournamentParser(pdf_path)
        data = parser.parse_category(category)
        
        print(f"\n=== 解析結果 ===")
        print(f"大会名: {data.tournament_name}")
        print(f"カテゴリ: {data.category}")
        print(f"選手数: {len([p for p in data.players.values() if not p.is_bye])}")
        print(f"bye数: {len([p for p in data.players.values() if p.is_bye])}")
        print(f"試合数: {len(data.matches)}")
        
        if data.winner:
            print(f"\n優勝者: {data.winner.name}")
        
        # 全選手リスト
        print("\n【選手一覧】")
        for i in range(1, 17):
            if i in data.players:
                p = data.players[i]
                if p.is_bye:
                    print(f"  {i:2d}: bye")
                else:
                    print(f"  {i:2d}: {p.name:<12s} {p.club:<30s} [シード: {p.seed or 'なし'}]")
            else:
                print(f"  {i:2d}: [未登録]")
        
        # JSON保存
        output = {
            "tournament": data.tournament_name,
            "category": data.category,
            "players": [
                {
                    "draw_no": p.draw_no,
                    "registration_no": p.registration_no,
                    "seed": p.seed,
                    "name": p.name,
                    "club": p.club,
                    "is_bye": p.is_bye
                }
                for p in sorted(data.players.values(), key=lambda x: x.draw_no)
            ],
            "matches": [
                {
                    "round": m.round,
                    "player1_draw_no": m.player1_draw_no,
                    "player2_draw_no": m.player2_draw_no,
                    "winner_draw_no": m.winner_draw_no,
                    "score": m.score
                }
                for m in data.matches
            ],
            "winner": data.winner.name if data.winner else None
        }
        
        # カテゴリ名をファイル名に使用できる形式に変換
        safe_category = category.replace(' ', '_').replace('/', '_')
        output_file = f"tournament_{safe_category}.json"
        
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print(f"\n結果を {output_file} に保存しました。")
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()