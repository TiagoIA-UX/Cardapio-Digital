-- =====================================================
-- 051: Ajustar escala de rating do feedback para 1-5
-- =====================================================
-- A migration 028 criou CHECK (rating BETWEEN 1 AND 4).
-- O padrão da indústria (NPS, Google, iFood) usa 1-5.
-- A migration 027 (support_tickets) já usava 1-5.
-- Esta migration corrige a inconsistência.
-- =====================================================
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_rating_check;
ALTER TABLE feedback
ADD CONSTRAINT feedback_rating_check CHECK (
        rating BETWEEN 1 AND 5
    );