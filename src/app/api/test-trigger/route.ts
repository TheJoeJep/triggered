import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url, method, headers, payload, timeout = 10000 } = body;

        if (!url || !method) {
            return NextResponse.json({ error: "Missing URL or Method" }, { status: 400 });
        }

        const startTime = Date.now();
        let response;

        try {
            response = await axios({
                method,
                url,
                headers: headers || {},
                data: payload,
                timeout,
                validateStatus: () => true, // Make sure we capture all status codes, not just 2xx
            });
        } catch (error: any) {
            // Axios throws for network errors or timeout/cancellation
            return NextResponse.json({
                success: false,
                status: 0,
                statusText: error.message || "Network Error",
                data: error.response?.data || null,
                duration: Date.now() - startTime,
                error: error.message
            });
        }

        const duration = Date.now() - startTime;

        return NextResponse.json({
            success: response.status >= 200 && response.status < 300,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
            duration,
        });

    } catch (error: any) {
        console.error("Test trigger error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
