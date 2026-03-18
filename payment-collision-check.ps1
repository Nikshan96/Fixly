param(
  [string]$AdminEmail = 'qa_admin_1774341402@fixly.test'
)

$ErrorActionPreference='Stop'

function ApiPost($url,$body,$token){
  $h=@{'Content-Type'='application/json'}
  if($token){$h['Authorization']="Bearer $token"}
  return Invoke-RestMethod -Method Post -Uri $url -Headers $h -Body ($body|ConvertTo-Json -Depth 8)
}
function ApiGet($url,$token){
  $h=@{}
  if($token){$h['Authorization']="Bearer $token"}
  return Invoke-RestMethod -Method Get -Uri $url -Headers $h
}
function ApiStatusPost($url,$body,$token){
  $h=@{'Content-Type'='application/json'}
  if($token){$h['Authorization']="Bearer $token"}
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Method Post -Uri $url -Headers $h -Body ($body|ConvertTo-Json -Depth 8)
    return @{ status=[int]$r.StatusCode; body=$r.Content }
  } catch {
    if($_.Exception.Response){
      $status=[int]$_.Exception.Response.StatusCode
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $content = $reader.ReadToEnd()
      return @{ status=$status; body=$content }
    }
    throw
  }
}

$base='http://localhost:5000/api'
$stamp=[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email="collision.customer.$stamp@fixly.local"
$techEmail="collision.tech.$stamp@fixly.local"
$pass='Pass@1234'

# prepare actors
ApiPost "$base/auth/register" @{name='Collision Customer';email=$email;password=$pass;phone='9801234500';address='KTM';role='customer'} $null | Out-Null
$techReg = ApiPost "$base/auth/register" @{name='Collision Tech';email=$techEmail;password=$pass;phone='9801234501';address='LTP';role='technician'} $null
$admin = ApiPost "$base/auth/login" @{email=$AdminEmail;password='Admin@123'} $null
$cust = ApiPost "$base/auth/login" @{email=$email;password=$pass} $null
$tech = ApiPost "$base/auth/login" @{email=$techEmail;password=$pass} $null

$adminToken=$admin.data.token
$custToken=$cust.data.token
$techToken=$tech.data.token

# create and progress booking to payment required
$serviceId=(ApiGet "$base/customer/services" $null).data[0].id
$booking=(ApiPost "$base/customer/bookings" @{service_id=$serviceId;booking_date='2026-03-26';booking_time='09:00';location='KTM';description='collision test'} $custToken).data
ApiPost "$base/technician/jobs/$($booking.id)/accept" @{} $techToken | Out-Null
ApiPost "$base/technician/jobs/$($booking.id)/start" @{} $techToken | Out-Null
ApiPost "$base/technician/jobs/$($booking.id)/complete" @{} $techToken | Out-Null

# start eSewa and capture active tx
$esewaInit = ApiPost "$base/payments/esewa/initiate" @{bookingId=$booking.id} $custToken
$esewaTx = $esewaInit.data.payload.transaction_uuid

# attempt khalti verify during active esewa attempt (should be 409, not overwrite)
$khaltiVerify = ApiStatusPost "$base/payments/khalti/verify" @{bookingId=$booking.id;pidx='fake-pidx-collision'} $custToken
$paymentAfter = (ApiGet "$base/payments/booking/$($booking.id)" $custToken).data

$result = [pscustomobject]@{
  bookingId = $booking.id
  esewaTransaction = $esewaTx
  khaltiVerifyStatus = $khaltiVerify.status
  paymentMethodAfterKhaltiVerify = $paymentAfter.payment_method
  paymentStatusAfterKhaltiVerify = $paymentAfter.status
}

$result | ConvertTo-Json -Depth 6
