// Shared helper to record staff commission for a booking after payment is captured/recorded.
// Looks up the booking's staff member's commission_type/rate and inserts a row in staff_commissions.
// Idempotent: skips insert when commission row already exists for the booking.

export async function recordStaffCommission(
  supabaseAdmin: any,
  params: {
    bookingId: string;
    businessId: string;
    serviceAmount: number;
    tipAmount?: number;
  }
) {
  try {
    const { bookingId, businessId, serviceAmount } = params;
    const tipAmount = Number(params.tipAmount || 0);

    // Need staff_id on the booking
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('staff_id')
      .eq('id', bookingId)
      .maybeSingle();
    const staffId = booking?.staff_id;
    if (!staffId) return;

    // Idempotency
    const { data: existing } = await supabaseAdmin
      .from('staff_commissions')
      .select('id')
      .eq('booking_id', bookingId)
      .maybeSingle();
    if (existing) return;

    // Look up commission settings
    const { data: staff } = await supabaseAdmin
      .from('staff_members')
      .select('commission_type, commission_rate')
      .eq('id', staffId)
      .maybeSingle();
    if (!staff) return;
    const type = staff.commission_type || 'none';
    if (type === 'none') return;
    const rate = Number(staff.commission_rate || 0);
    if (rate <= 0) return;

    let amount = 0;
    if (type === 'percentage') {
      amount = Number(serviceAmount) * (rate / 100);
    } else if (type === 'fixed') {
      amount = rate;
    }
    amount = Math.max(0, Number(amount.toFixed(2)));

    await supabaseAdmin.from('staff_commissions').insert({
      business_id: businessId,
      staff_id: staffId,
      booking_id: bookingId,
      service_price: Number(serviceAmount).toFixed(2),
      tip_amount: tipAmount.toFixed(2),
      commission_type: type,
      commission_rate: rate,
      commission_amount: amount,
    });
  } catch (e) {
    console.error('recordStaffCommission failed', e);
  }
}
