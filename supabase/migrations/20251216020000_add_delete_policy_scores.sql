-- Add DELETE policy for scores table to allow admin deletion
CREATE POLICY IF NOT EXISTS scores_delete_public ON public.scores FOR DELETE USING (true);
