-- 選手データの投入（updated_atにもDEFAULT値を設定）
INSERT INTO players (registration_no, name, club, prefecture, created_at, updated_at) VALUES
('G23450', '大﨑 浩', '土山''Ｓ', '兵庫県', NOW(), NOW()),
('G25083', '弓田 悟', '百合ヶ丘ファミリーテニスクラブ', '神奈川県', NOW(), NOW()),
('G19889', '手塚 学', '佐賀ＧＴＣ', '佐賀県', NOW(), NOW());

-- ランキングデータの投入
INSERT INTO rankings (player_id, category, rank_position, total_points, calc_points, ranking_date, created_at) VALUES
(1, 'gs45', 1, 8277, 7477, '2025-04-30', NOW()),
(2, 'gs45', 2, 5971, 5971, '2025-04-30', NOW()),
(3, 'gs45', 3, 5926, 5352, '2025-04-30', NOW());