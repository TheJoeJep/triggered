export default function McpPage() {
  const apiKey = localStorage.getItem('token') // In a real app, get the actual API key

  const mcpConfig = {
    mcpServers: {
      triggered: {
        command: 'npx',
        args: [
          '-y',
          '@modelcontextprotocol/server-everything',
        ],
        env: {
          TRIGGERED_API_KEY: 'YOUR_API_KEY_HERE',
          TRIGGERED_API_URL: 'http://localhost:3000',
        },
      },
    },
  }

  const curlExample = `curl -X POST http://localhost:3000/mcp/triggers/create \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "name": "My Trigger",
    "webhookUrl": "https://example.com/webhook",
    "payload": {"key": "value"},
    "scheduleType": "interval",
    "delayMinutes": 5,
    "enabled": true
  }'`

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">MCP Integration</h1>

      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">What is MCP?</h2>
        <p className="text-gray-600 mb-4">
          Model Context Protocol (MCP) allows AI agents to interact with external systems.
          The Triggered MCP server lets your AI agent create and manage triggers programmatically.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Copy your API key from the{' '}
            <a href="/api-keys" className="underline font-semibold">
              API Keys page
            </a>{' '}
            and replace YOUR_API_KEY_HERE in the examples below.
          </p>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">MCP Configuration</h2>
        <p className="text-sm text-gray-600 mb-4">
          Add this to your Claude Desktop config file (config.json):
        </p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
          {JSON.stringify(mcpConfig, null, 2)}
        </pre>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">API Endpoints</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">List Triggers</h3>
            <code className="block bg-gray-100 p-2 rounded text-sm">
              GET /mcp/triggers/list
            </code>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Create Trigger</h3>
            <code className="block bg-gray-100 p-2 rounded text-sm">
              POST /mcp/triggers/create
            </code>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Update Trigger</h3>
            <code className="block bg-gray-100 p-2 rounded text-sm">
              PUT /mcp/triggers/:id
            </code>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Delete Trigger</h3>
            <code className="block bg-gray-100 p-2 rounded text-sm">
              DELETE /mcp/triggers/:id
            </code>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Example: Create a Trigger</h2>
        <p className="text-sm text-gray-600 mb-4">
          Using curl to create a trigger:
        </p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
          {curlExample}
        </pre>
      </div>
    </div>
  )
}

