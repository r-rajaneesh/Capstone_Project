import { ChevronDown, ChevronUp, Terminal } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface HashLogEntry {
	timestamp: string;
	program: "C" | "C++";
	file: string;
	hash: string;
	status: "processing" | "completed" | "error";
	message?: string;
}

interface HashConsoleProps {
	logs: HashLogEntry[];
	isProcessing: boolean;
}

const HashConsole: React.FC<HashConsoleProps> = ({ logs, isProcessing }) => {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const logEndRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when new logs are added
	useEffect(() => {
		if (logEndRef.current) {
			logEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [logs]);

	return (
		<div className="fixed bottom-4 right-4 w-96 bg-gray-900 text-green-400 rounded-lg shadow-2xl border border-gray-700 z-50">
			{/* Header */}
			<div className="flex items-center justify-between p-3 border-b border-gray-700">
				<div className="flex items-center space-x-2">
					<Terminal className="h-4 w-4" />
					<span className="text-sm font-medium">Hash Processing Console</span>
					{isProcessing && (
						<div className="flex items-center space-x-1">
							<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
							<span className="text-xs text-gray-400">Processing</span>
						</div>
					)}
				</div>
				<div className="flex items-center space-x-2">
					<button
						onClick={() => setIsCollapsed(!isCollapsed)}
						className="text-gray-400 hover:text-white transition-colors">
						{isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
					</button>
				</div>
			</div>

			{/* Console Content */}
			{!isCollapsed && (
				<div className="max-h-80 overflow-y-auto">
					<div className="p-3 font-mono text-xs">
						{logs.length === 0 ? (
							<div className="text-gray-500 italic">Waiting for files to process...</div>
						) : (
							logs.map((log, index) => (
								<div
									key={index}
									className="mb-2">
									<div className="flex items-center space-x-2">
										<span className="text-gray-500">[{log.timestamp}]</span>
										<span
											className={`px-2 py-1 rounded text-xs font-medium ${
												log.program === "C" ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
											}`}>
											{log.program}
										</span>
										<span className="text-gray-300">{log.file}</span>
									</div>
									<div className="ml-4 mt-1">
										{log.status === "processing" && (
											<div className="flex items-center space-x-2">
												<div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
												<span className="text-yellow-400">Processing...</span>
											</div>
										)}
										{log.status === "completed" && (
											<div className="flex items-center space-x-2">
												<div className="w-2 h-2 bg-green-400 rounded-full"></div>
												<span className="text-green-400">Hash: {log.hash}</span>
											</div>
										)}
										{log.status === "error" && (
											<div className="flex items-center space-x-2">
												<div className="w-2 h-2 bg-red-400 rounded-full"></div>
												<span className="text-red-400">Error: {log.message}</span>
											</div>
										)}
									</div>
								</div>
							))
						)}
					</div>
					<div ref={logEndRef} />
				</div>
			)}
		</div>
	);
};

export default HashConsole;
