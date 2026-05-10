import { supabase } from '../supabaseClient';

export async function loadTradeHistory(userId) {
  if (!supabase || !userId) return [];
  
  const { data, error } = await supabase
    .from('trade_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error loading trade history:', error);
    return [];
  }
  
  return data || [];
}

export async function saveTradeToHistory(userId, trade) {
  if (!supabase || !userId) return null;
  
  const { data, error } = await supabase
    .from('trade_history')
    .insert([{
      user_id: userId,
      symbol: trade.symbol,
      date: trade.date,
      bias: trade.bias,
      entry: trade.entry,
      rr: trade.rr,
      rating: trade.rating,
      score: trade.score,
      status: trade.status || 'Pending',
      analysis: trade.analysis,
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error saving trade:', error);
    return null;
  }
  
  return data;
}

export async function updateTradeStatus(userId, tradeId, status) {
  if (!supabase || !userId) return null;
  
  const { data, error } = await supabase
    .from('trade_history')
    .update({ status })
    .eq('id', tradeId)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating trade status:', error);
    return null;
  }
  
  return data;
}

export async function deleteTrade(userId, tradeId) {
  if (!supabase || !userId) return false;
  
  const { error } = await supabase
    .from('trade_history')
    .delete()
    .eq('id', tradeId)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error deleting trade:', error);
    return false;
  }
  
  return true;
}