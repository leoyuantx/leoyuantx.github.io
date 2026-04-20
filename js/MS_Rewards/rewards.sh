#!/bin/bash

# MS Rewards API caller using curl
# POST /msrewards/api/v1/reportactivity

URL="https://www.bing.com/msrewards/api/v1/reportactivity"

# JSON payload
JSON_DATA='{
  "ActivityAttributes" : {
    "SearchQuery" : "Popular now on Bing"
  },
  "ActivityType" : "search",
  "UserId" : "5F2A37E81C785C01D7E035EDFFFFFFFF",
  "ActivitySubType" : "",
  "Channel" : "Mobile",
  "PartnerId" : "OpalApp"
}'

# Function to make API call
make_api_call() {
    local call_number=$1
    
    echo "=== Making API call ${call_number}/5 ==="
    echo "Response:"
    
    response=$(curl -X POST "$URL" \
        -H "Accept: application/json" \
        -H "Accept-Encoding: gzip" \
        -H "Accept-Language: en-us" \
        -H "Connection: keep-alive" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -H "Cookie: MUIDB=00A22397689463122883293469F56234; SRCHUID=V=2&GUID=253BF281F9944D169196EE5CE330EF31; _EDGE_E=O=tabux-opal; _EDGE_S=SID=32A28BA5378C69B81F2B8108362E6841; _SS=SID=32A28BA5378C69B81F2B8108362E6841; _RwBf=s=40&o=0&A=5F2A37E81C785C01D7E035EDFFFFFFFF; SRCHHPGUSR=CW=375&CH=130&DPR=2&UTC=-300; WLID=tGi1bj+9InB0WBIGQPo+b0Y8nxPxrGeG9Qs7W3CWH+6HiDV7XW2K++bNb5Z4Nzw0S8+3J78GGZs1LKJcRTXDBtsVWvuEUetiPjLeIbFIS44=; _U=1A4FljpWhimarbcbt14hTmNjm6p5RKJYC8C1DTQdjRp4kgB_zjuArECDRgVieGDgEjjbsOBVIIREZMgbQ-BQkdXT7j1fvvXKPFSqkymCb-qWk8KsCG6xbDirWei3mxmVG; MUID=00A22397689463122883293469F56234; SRCHD=AF=NOFORM; SRCHUSR=DOB=20170616; _EDGE_V=1" \
        -H "Host: www.bing.com" \
        -H "Opal-SessionId: F8089EEFAB0240D7A2E3A97AF3592138" \
        -H "Opal-AltClientId: BA370490396A4849859BB6CAE3CD5F02" \
        -H "X-MSEdge-TrafficTier: premium" \
        -H "Opal-Configuration: Production" \
        -H "Opal-AdId: 7337F35992E24D88BAAA28AA4A3780C8" \
        -H "Opal-AppName: Opal" \
        -H "Opal-InPrivate: 0" \
        -H "X-Search-UILang: en-us" \
        -H "Opal-ApiVersion: 14" \
        -H "Opal-OSVersion: 10.3.2" \
        -H "Opal-ClientVersion: 6.16.1.0" \
        -H "Opal-DeviceType: iphone6" \
        -H "Opal-NewUser: 0" \
        -H "X-Search-ClientId: 845E245F7D4A4432B07F43F46E52F948" \
        -H "X-BM-Client: Opal/6.16.1.0" \
        -H "X-Search-Market: en-us" \
        -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_2 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4" \
        -d "$JSON_DATA" \
        -w "|||HTTP_STATUS:%{http_code}|||TIME:%{time_total}s|||" \
        -s)
    
    # Extract response body and status info
    status_info=$(echo "$response" | grep -o "|||.*|||$")
    response_body=$(echo "$response" | sed 's/|||.*|||$//')
    
    echo "$response_body"
    echo ""
    echo "$(echo "$status_info" | sed 's/|||/ | /g' | sed 's/^| //' | sed 's/ |$//')"
    
    echo -e "\n"
}

# Main execution loop
echo "Starting MS Rewards API calls..."
echo "Will make 5 API calls with 7 second delays between them"
echo "======================================================="

for i in {1..5}; do
    make_api_call $i
    
    # Add delay except after the last call
    if [ $i -lt 5 ]; then
        echo "Waiting 7 seconds before next call..."
        sleep 7
        echo ""
    fi
done

echo "======================================================="
echo "All 5 API calls completed!"