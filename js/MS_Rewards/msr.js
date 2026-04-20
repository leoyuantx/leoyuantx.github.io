async function reportActivity(activityData = {}) {
    const url = 'https://www.bing.com/msrewards/api/v1/reportactivity';
    
    // Default activity data
    const defaultActivityData = {
        "ActivityAttributes": {
            "SearchQuery": "Popular now on Bing"
        },
        "ActivityType": "search",
        "UserId": "5F2A37E81C785C01D7E035EDFFFFFFFF",
        "ActivitySubType": "",
        "Channel": "Mobile",
        "PartnerId": "OpalApp"
    };
    
    // Merge with provided data
    const requestData = { ...defaultActivityData, ...activityData };
    
    const headers = {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'Accept-Language': 'en-us',
        'Connection': 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': 'MUIDB=00A22397689463122883293469F56234; SRCHUID=V=2&GUID=253BF281F9944D169196EE5CE330EF31; _EDGE_E=O=tabux-opal; _EDGE_S=SID=32A28BA5378C69B81F2B8108362E6841; _SS=SID=32A28BA5378C69B81F2B8108362E6841; _RwBf=s=40&o=0&A=5F2A37E81C785C01D7E035EDFFFFFFFF; SRCHHPGUSR=CW=375&CH=130&DPR=2&UTC=-300; WLID=tGi1bj+9InB0WBIGQPo+b0Y8nxPxrGeG9Qs7W3CWH+6HiDV7XW2K++bNb5Z4Nzw0S8+3J78GGZs1LKJcRTXDBtsVWvuEUetiPjLeIbFIS44=; _U=1A4FljpWhimarbcbt14hTmNjm6p5RKJYC8C1DTQdjRp4kgB_zjuArECDRgVieGDgEjjbsOBVIIREZMgbQ-BQkdXT7j1fvvXKPFSqkymCb-qWk8KsCG6xbDirWei3mxmVG; MUID=00A22397689463122883293469F56234; SRCHD=AF=NOFORM; SRCHUSR=DOB=20170616; _EDGE_V=1',
        'Host': 'www.bing.com',
        'Opal-SessionId': 'F8089EEFAB0240D7A2E3A97AF3592138',
        'Opal-AltClientId': 'BA370490396A4849859BB6CAE3CD5F02',
        'X-MSEdge-TrafficTier': 'premium',
        'Opal-Configuration': 'Production',
        'Opal-AdId': '7337F35992E24D88BAAA28AA4A3780C8',
        'Opal-AppName': 'Opal',
        'Opal-InPrivate': '0',
        'X-Search-UILang': 'en-us',
        'Opal-ApiVersion': '14',
        'Opal-OSVersion': '10.3.2',
        'Opal-ClientVersion': '6.16.1.0',
        'Opal-DeviceType': 'iphone6',
        'Opal-NewUser': '0',
        'X-Search-ClientId': '845E245F7D4A4432B07F43F46E52F948',
        'X-BM-Client': 'Opal/6.16.1.0',
        'X-Search-Market': 'en-us',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_2 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4'
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error('Error calling MS Rewards API:', error);
        throw error;
    }
}

async function singleCall() {
    try {    
        const result = await reportActivity();
        const availableSafe = result?.Balance?.Available;
        console.log('Available points:', availableSafe);
        
    } catch (error) {
        console.error('API call failed:', error);
    }
}

// Helper function to create delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loopCall() {
    for (let i = 1; i <= 21; i++) {
        console.log(`=== Running ${i}/21 ===`);
        await singleCall();
        
        await sleep(7000);
    }
    console.log('\n=== All 21 completed ===');
}

loopCall();