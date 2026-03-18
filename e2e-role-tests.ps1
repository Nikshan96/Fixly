param(
  [string]$AdminEmail = 'admin@fixly.com'
)

$ErrorActionPreference='Stop'

function JPost($url,$body,$token){
  $h=@{}
  if($token){$h['Authorization']="Bearer $token"}
  $h['Content-Type']='application/json'
  return Invoke-RestMethod -Method Post -Uri $url -Headers $h -Body ($body|ConvertTo-Json -Depth 8)
}

function JPut($url,$body,$token){
  $h=@{}
  if($token){$h['Authorization']="Bearer $token"}
  $h['Content-Type']='application/json'
  return Invoke-RestMethod -Method Put -Uri $url -Headers $h -Body ($body|ConvertTo-Json -Depth 8)
}

function JGet($url,$token){
  $h=@{}
  if($token){$h['Authorization']="Bearer $token"}
  return Invoke-RestMethod -Method Get -Uri $url -Headers $h
}

$base='http://localhost:5000/api'
$stamp=[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$customerEmail="e2e.customer.$stamp@fixly.local"
$tech1Email="e2e.tech1.$stamp@fixly.local"
$tech2Email="e2e.tech2.$stamp@fixly.local"
$pass='Pass@1234'
$results=@()

function AddResult($name,$ok,$detail){
  $script:results += [pscustomobject]@{
    step=$name
    status=($(if($ok){'PASS'}else{'FAIL'}))
    detail=$detail
  }
}

try {
  $custReg = JPost "$base/auth/register" @{name='E2E Customer';email=$customerEmail;password=$pass;phone='9800000001';address='Kathmandu';role='customer'} $null
  AddResult 'Register customer' $true "id=$($custReg.data.user.id)"

  $tech1Reg = JPost "$base/auth/register" @{name='E2E Tech One';email=$tech1Email;password=$pass;phone='9800000002';address='Lalitpur';role='technician'} $null
  AddResult 'Register technician 1' $true "id=$($tech1Reg.data.user.id)"

  $tech2Reg = JPost "$base/auth/register" @{name='E2E Tech Two';email=$tech2Email;password=$pass;phone='9800000003';address='Bhaktapur';role='technician'} $null
  AddResult 'Register technician 2' $true "id=$($tech2Reg.data.user.id)"

  $adminLogin = JPost "$base/auth/login" @{email=$AdminEmail;password='Admin@123'} $null
  $adminToken=$adminLogin.data.token
  AddResult 'Admin login' $true "id=$($adminLogin.data.user.id)"

  $custLogin = JPost "$base/auth/login" @{email=$customerEmail;password=$pass} $null
  $custToken=$custLogin.data.token
  AddResult 'Customer login' $true "id=$($custLogin.data.user.id)"

  $tech1Login = JPost "$base/auth/login" @{email=$tech1Email;password=$pass} $null
  $tech1Token=$tech1Login.data.token
  AddResult 'Tech1 login' $true "id=$($tech1Login.data.user.id)"

  $tech2Login = JPost "$base/auth/login" @{email=$tech2Email;password=$pass} $null
  $tech2Token=$tech2Login.data.token
  AddResult 'Tech2 login' $true "id=$($tech2Login.data.user.id)"

  $services = JGet "$base/customer/services" $null
  $serviceId = $services.data[0].id
  AddResult 'Public services fetch' $true "serviceId=$serviceId"

  $bookingA = JPost "$base/customer/bookings" @{service_id=$serviceId;booking_date='2026-03-25';booking_time='10:00';location='Kathmandu';description='E2E Booking A'} $custToken
  $bookingAId = $bookingA.data.id
  AddResult 'Customer creates booking A' $true "bookingId=$bookingAId"

  $assignA = JPut "$base/admin/bookings/$bookingAId" @{technician_id=$tech1Reg.data.user.id} $adminToken
  AddResult 'Admin assigns tech1 to booking A' $true $assignA.message

  $reassignA = JPut "$base/admin/bookings/$bookingAId" @{technician_id=$tech2Reg.data.user.id} $adminToken
  AddResult 'Admin reassigns booking A to tech2' $true $reassignA.message

  $bookingB = JPost "$base/customer/bookings" @{service_id=$serviceId;booking_date='2026-03-25';booking_time='11:00';location='Lalitpur';description='E2E Booking B'} $custToken
  $bookingBId = $bookingB.data.id
  AddResult 'Customer creates booking B' $true "bookingId=$bookingBId"

  $acceptB = JPost "$base/technician/jobs/$bookingBId/accept" @{} $tech1Token
  AddResult 'Tech1 accepts booking B' $true 'accepted'

  $startB = JPost "$base/technician/jobs/$bookingBId/start" @{} $tech1Token
  AddResult 'Tech1 starts booking B' $true $startB.message

  $completeB = JPost "$base/technician/jobs/$bookingBId/complete" @{} $tech1Token
  AddResult 'Tech1 marks work done booking B' $true $completeB.message

  $paymentB = JGet "$base/payments/booking/$bookingBId" $custToken
  AddResult 'Customer fetches payment record B' $true "status=$($paymentB.data.status)"

  $bookingBState = JGet "$base/customer/bookings" $custToken
  $b = $bookingBState.data | Where-Object { $_.id -eq $bookingBId } | Select-Object -First 1
  AddResult 'Booking B remains in-progress before payment' ($b.status -eq 'in-progress') "status=$($b.status)"

  $openSupport = JPost "$base/messages/support/conversations/$($tech1Reg.data.user.id)" @{} $adminToken
  $supportConvId = $openSupport.data.id
  AddResult 'Admin opens support conversation' $true "convId=$supportConvId"

  $sendSupport = JPost "$base/messages/support/conversations/$supportConvId/messages" @{message='Please share today status update'} $adminToken
  AddResult 'Admin sends support message' $true "msgId=$($sendSupport.data.id)"

  $techSupportList = JGet "$base/messages/support/conversations" $tech1Token
  $hasSupport = @($techSupportList.data | Where-Object { $_.id -eq $supportConvId }).Count -gt 0
  AddResult 'Tech1 can view support conversation' $hasSupport "count=$(@($techSupportList.data).Count)"

  $techConvs = JGet "$base/messages/conversations" $tech1Token
  $bookingConv = $techConvs.data | Where-Object { $_.booking_id -eq $bookingBId } | Select-Object -First 1
  if($null -ne $bookingConv){
    $sentTech = JPost "$base/messages/conversations/$($bookingConv.id)/messages" @{message='Hello customer from technician'} $tech1Token
    AddResult 'Tech1 sends booking chat message' $true "msgId=$($sentTech.data.id)"
    try {
      $denyAdmin = JPost "$base/messages/conversations/$($bookingConv.id)/messages" @{message='Admin should not send'} $adminToken
      AddResult 'Admin blocked from booking chat send' $false 'unexpectedly allowed'
    } catch {
      AddResult 'Admin blocked from booking chat send' $true 'blocked as expected'
    }
  } else {
    AddResult 'Booking conversation exists for booking B' $false 'conversation not found'
  }

  $results | ConvertTo-Json -Depth 8
}
catch {
  AddResult 'Unhandled test script exception' $false $_.Exception.Message
  $results | ConvertTo-Json -Depth 8
  exit 1
}
