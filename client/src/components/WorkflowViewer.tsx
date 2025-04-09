import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Định nghĩa các trạng thái của node
type NodeStatus = 'todo' | 'doing' | 'done';

// Định nghĩa các hình dạng của node
type NodeShape = 'rectangle' | 'rounded' | 'diamond' | 'ellipse' | 'hexagon';

// Định nghĩa các màu sắc của node
type NodeColor = 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'red';

// Định nghĩa dữ liệu cho node
interface WorkflowNode {
  id: string;
  title: string;
  status: NodeStatus;
  x: number;
  y: number;
  shape?: NodeShape;
  color?: NodeColor;
}

// Định nghĩa dữ liệu cho liên kết giữa các node
interface WorkflowConnection {
  id: string;
  sourceId: string;
  targetId: string;
}

// Props cho component WorkflowViewer
interface WorkflowViewerProps {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

// Hàm lấy màu dựa trên trạng thái
const getStatusColor = (status: NodeStatus): string => {
  switch (status) {
    case 'todo':
      return 'bg-green-500';
    case 'doing':
      return 'bg-yellow-500';
    case 'done':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

// Lấy class CSS cho hình dạng của node
const getShapeClass = (shape?: NodeShape): string => {
  switch (shape) {
    case 'rectangle':
      return 'rounded-none';
    case 'rounded':
      return 'rounded-xl';
    case 'diamond':
      return 'rounded-lg transform rotate-45';
    case 'ellipse':
      return 'rounded-[50%]';
    case 'hexagon':
      return 'rounded-lg clip-path-hexagon';
    default:
      return 'rounded-lg';
  }
};

// Lấy class CSS cho màu sắc của node
const getColorClass = (color?: NodeColor): string => {
  switch (color) {
    case 'blue':
      return 'bg-blue-50 border-blue-200';
    case 'green':
      return 'bg-green-50 border-green-200';
    case 'purple':
      return 'bg-purple-50 border-purple-200';
    case 'orange':
      return 'bg-orange-50 border-orange-200';
    case 'pink':
      return 'bg-pink-50 border-pink-200';
    case 'red':
      return 'bg-red-50 border-red-200';
    default:
      return 'bg-white border-gray-200';
  }
};

// Component để hiển thị một node trong workflow
const WorkflowNode: React.FC<{ 
  node: WorkflowNode;
  onDragStart: (e: React.DragEvent, nodeId: string) => void;
  onDrop: (e: React.DragEvent, nodeId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onNodeClick: (nodeId: string) => void;
  onConnectorClick: (nodeId: string, position: string) => void;
  isSelected: boolean;
  isDrawingConnection: boolean;
}> = ({ 
  node, 
  onDragStart, 
  onDrop, 
  onDragOver, 
  onNodeClick, 
  onConnectorClick, 
  isSelected,
  isDrawingConnection
}) => {
  const statusColor = getStatusColor(node.status);
  const shapeClass = getShapeClass(node.shape);
  const colorClass = getColorClass(node.color);
  
  // Các vị trí của connector
  const connectorPositions = [
    'top-center', 'top-right', 'bottom-center', 'bottom-right',
    'middle-left', 'middle-right', 'top-left', 'bottom-left'
  ];

  return (
    <div
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 ${isSelected ? 'scale-105' : ''}`}
      style={{ left: `${node.x}px`, top: `${node.y}px` }}
      onClick={() => onNodeClick(node.id)}
      draggable
      onDragStart={(e) => onDragStart(e, node.id)}
      onDrop={(e) => onDrop(e, node.id)}
      onDragOver={onDragOver}
    >
      <div className={`w-48 h-32 shadow-xl border-2 flex flex-col overflow-hidden transition-all duration-200 ${shapeClass} ${colorClass} ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
            <span className="text-xs text-gray-500">{node.id}</span>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">{node.title}</h3>
          <div className="mt-auto">
            <span className={`px-2 py-1 rounded-full text-xs text-white ${statusColor}`}>
              {node.status.toUpperCase()}
            </span>
          </div>
        </div>
        
        {/* Connection points - 8 điểm kết nối quanh node */}
        <div 
          className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-pointer ${isDrawingConnection ? 'animate-pulse' : ''}`}
          onClick={(e) => { e.stopPropagation(); onConnectorClick(node.id, 'top-center'); }}
        ></div>
        <div 
          className={`absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-pointer ${isDrawingConnection ? 'animate-pulse' : ''}`}
          onClick={(e) => { e.stopPropagation(); onConnectorClick(node.id, 'top-right'); }}
        ></div>
        <div 
          className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-pointer ${isDrawingConnection ? 'animate-pulse' : ''}`}
          onClick={(e) => { e.stopPropagation(); onConnectorClick(node.id, 'bottom-center'); }}
        ></div>
        <div 
          className={`absolute bottom-0 right-0 transform translate-x-1/2 translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-pointer ${isDrawingConnection ? 'animate-pulse' : ''}`}
          onClick={(e) => { e.stopPropagation(); onConnectorClick(node.id, 'bottom-right'); }}
        ></div>
        <div 
          className={`absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-pointer ${isDrawingConnection ? 'animate-pulse' : ''}`}
          onClick={(e) => { e.stopPropagation(); onConnectorClick(node.id, 'middle-left'); }}
        ></div>
        <div 
          className={`absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-pointer ${isDrawingConnection ? 'animate-pulse' : ''}`}
          onClick={(e) => { e.stopPropagation(); onConnectorClick(node.id, 'middle-right'); }}
        ></div>
        <div 
          className={`absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-pointer ${isDrawingConnection ? 'animate-pulse' : ''}`}
          onClick={(e) => { e.stopPropagation(); onConnectorClick(node.id, 'top-left'); }}
        ></div>
        <div 
          className={`absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-pointer ${isDrawingConnection ? 'animate-pulse' : ''}`}
          onClick={(e) => { e.stopPropagation(); onConnectorClick(node.id, 'bottom-left'); }}
        ></div>
      </div>
    </div>
  );
};

// Định nghĩa loại hành động cho kết nối
type ConnectionAction = 'proceed' | 'validate' | 'notify' | 'approve' | 'reject';

// Interface cho kết nối với hành động
interface WorkflowConnectionWithAction extends WorkflowConnection {
  action?: ConnectionAction;
  actionDescription?: string;
  function?: string; // Hàm JavaScript có thể chạy cho kết nối
}

// Màu sắc cho các hành động
const getActionColor = (action?: ConnectionAction): string => {
  switch (action) {
    case 'proceed':
      return '#22c55e'; // green-500
    case 'validate':
      return '#3b82f6'; // blue-500
    case 'notify':
      return '#f59e0b'; // amber-500
    case 'approve':
      return '#10b981'; // emerald-500
    case 'reject':
      return '#ef4444'; // red-500
    default:
      return '#94a3b8'; // slate-400
  }
};

// Component để hiển thị liên kết giữa các node
const WorkflowConnection: React.FC<{
  connection: WorkflowConnectionWithAction;
  sourceNode: WorkflowNode;
  targetNode: WorkflowNode;
  onConnectionClick: (connectionId: string) => void;
  onDeleteConnection: (connectionId: string) => void;
  isSelected: boolean;
}> = ({ 
  connection, 
  sourceNode, 
  targetNode, 
  onConnectionClick,
  onDeleteConnection,
  isSelected 
}) => {
  // State cho popup menu
  const [showContextMenu, setShowContextMenu] = useState(false);
  
  // Tính toán điểm bắt đầu và kết thúc cho đường nối
  const startX = sourceNode.x;
  const startY = sourceNode.y;
  const endX = targetNode.x;
  const endY = targetNode.y;

  // Tính toán các thuộc tính cho đường nối SVG
  const dx = endX - startX;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Tính vị trí giữa đường kết nối để hiển thị nhãn hành động
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  
  // Tính toán các điểm cho đường cong Bezier
  const bezierOffset = 30; // Độ cong của đường
  
  // Tạo điểm điều khiển cho đường cong
  const controlPoint1X = startX + dx / 3;
  const controlPoint1Y = startY + dy / 3 - bezierOffset;
  const controlPoint2X = startX + (2 * dx) / 3;
  const controlPoint2Y = startY + (2 * dy) / 3 + bezierOffset;
  
  // Tạo điểm để đặt mũi tên giữa đường nối
  const midPointPath = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
  
  // Tính toán 1/3 và 2/3 chiều dài của đường path để đặt mũi tên ở giữa
  const point1_3Percent = 0.33; // 1/3 chiều dài đường path
  const point2_3Percent = 0.66; // 2/3 chiều dài đường path
  
  // Hàm để lấy tọa độ từ path dựa vào phần trăm chiều dài
  const getPointAtPercentOfPath = (pathElement: SVGPathElement, percent: number) => {
    const pathLength = pathElement.getTotalLength();
    const point = pathElement.getPointAtLength(pathLength * percent);
    return point;
  };
  
  // Reference đến SVG path để tính toán các điểm
  const pathRef = useRef<SVGPathElement>(null);
  
  // State để lưu tọa độ của các điểm mũi tên ở giữa đường path
  const [midArrowPoint, setMidArrowPoint] = useState<{ x: number, y: number, angle: number } | null>(null);
  
  // Effect để tính toán vị trí của mũi tên giữa đường khi path thay đổi
  useEffect(() => {
    // Tính toán vị trí mũi tên sau khi DOM đã render
    if (pathRef.current) {
      const pathElement = pathRef.current;
      const point = getPointAtPercentOfPath(pathElement, 0.5); // Lấy điểm giữa đường path
      
      // Lấy góc tiếp tuyến tại điểm đó
      const pathLength = pathElement.getTotalLength();
      const pointBefore = pathElement.getPointAtLength(pathLength * 0.5 - 0.1);
      const pointAfter = pathElement.getPointAtLength(pathLength * 0.5 + 0.1);
      
      // Tính góc tiếp tuyến
      const dx = pointAfter.x - pointBefore.x;
      const dy = pointAfter.y - pointBefore.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      setMidArrowPoint({ x: point.x, y: point.y, angle });
    }
  }, [startX, startY, endX, endY]);
  
  // Lấy màu hành động
  const actionColor = getActionColor(connection.action);
  
  // Xử lý khi click vào đường kết nối
  const handleLineClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Hiển thị menu context thay vì mở editor ngay lập tức
    setShowContextMenu(true);
  };
  
  // Xử lý khi chọn menu item
  const handleMenuItemClick = (action: string) => {
    setShowContextMenu(false);
    
    switch (action) {
      case 'edit':
        onConnectionClick(connection.id);
        break;
      case 'function':
        // Thêm một hàm mẫu cho kết nối (thêm property function)
        const simpleFunctionTemplate = `function handleTransition(data) {
  console.log('Chuyển từ ${sourceNode.title} đến ${targetNode.title}', data);
  return data;
}`;
        
        // Gọi api để cập nhật kết nối trên toàn bộ ứng dụng
        const updatedConnection = { 
          ...connection, 
          function: simpleFunctionTemplate 
        };
        
        // Thay vì chỉ tạo đối tượng mới, gửi sự kiện để cập nhật trong state chính
        const event = new CustomEvent('workflow:update-connection', { 
          detail: { 
            connectionId: connection.id,
            function: simpleFunctionTemplate 
          } 
        });
        window.dispatchEvent(event);
        
        // Gọi đến hàm click kết nối để hiển thị panel edit
        onConnectionClick(connection.id);
        break;
      case 'delete':
        onDeleteConnection(connection.id);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <svg
        className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <marker
            id={`arrowhead-${connection.id}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={actionColor} />
          </marker>
          
          <marker
            id={`mid-arrowhead-${connection.id}`}
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={actionColor} />
          </marker>
        </defs>
        
        {/* Đường cong Bezier tham chiếu - ẩn, chỉ dùng để tính toán */}
        <path
          ref={pathRef}
          d={midPointPath}
          stroke="transparent"
          fill="none"
          style={{ visibility: 'hidden' }}
        />
        
        {/* Đường nối chính */}
        <path
          d={midPointPath}
          stroke={actionColor}
          strokeWidth={isSelected ? "3" : "2"}
          strokeDasharray={connection.action ? "none" : "5,5"}
          fill="none"
          markerEnd={`url(#arrowhead-${connection.id})`}
        />
        
        {/* Mũi tên ở giữa đường path */}
        {midArrowPoint && (
          <g transform={`translate(${midArrowPoint.x}, ${midArrowPoint.y}) rotate(${midArrowPoint.angle})`}>
            <line
              x1="-10"
              y1="0"
              x2="0"
              y2="0"
              stroke={actionColor}
              strokeWidth={isSelected ? "3" : "2"}
              markerEnd={`url(#mid-arrowhead-${connection.id})`}
            />
          </g>
        )}
        
        {/* Điểm điều khiển ở giữa cho kết nối đang được chọn */}
        {isSelected && midArrowPoint && (
          <circle
            cx={midArrowPoint.x}
            cy={midArrowPoint.y}
            r="6"
            fill="white"
            stroke={actionColor}
            strokeWidth="2"
          />
        )}
      </svg>
      
      {/* Vùng điều khiển ẩn cho đường kết nối (để bắt sự kiện click) */}
      <div
        className="absolute z-10 cursor-pointer"
        style={{
          left: `${Math.min(startX, endX) - 5}px`,
          top: `${Math.min(startY, endY) - 5}px`,
          width: `${Math.abs(endX - startX) + 10}px`,
          height: `${Math.abs(endY - startY) + 10}px`,
          transform: 'rotate(0deg)',
          transformOrigin: 'center',
        }}
        onClick={handleLineClick}
      />
      
      {/* Menu context cho kết nối */}
      {showContextMenu && (
        <div 
          className="absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-1 w-48"
          style={{ 
            left: `${midX}px`, 
            top: `${midY}px`,
            transform: 'translate(-50%, -50%)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs font-medium text-gray-500 px-2 py-1 border-b border-gray-100">
            Tùy chọn kết nối
          </div>
          <button 
            className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-50 rounded flex items-center text-blue-600"
            onClick={() => handleMenuItemClick('edit')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Thêm hành động
          </button>
          <button 
            className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-50 rounded flex items-center text-purple-600"
            onClick={() => handleMenuItemClick('function')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
            Thêm fun
          </button>
          <button 
            className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-50 rounded flex items-center text-red-600"
            onClick={() => handleMenuItemClick('delete')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            Xóa dây
          </button>
        </div>
      )}
      
      {/* Hiển thị hành động của kết nối ở giữa đường nối */}
      {connection.action && !showContextMenu && midArrowPoint && (
        <div 
          className="absolute bg-white px-2 py-1 rounded-md border shadow-sm text-xs font-medium z-20 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          style={{ 
            left: `${midArrowPoint.x}px`, 
            top: `${midArrowPoint.y - 20}px`, // Hiển thị ở trên mũi tên
            borderColor: actionColor,
            color: actionColor
          }}
          onClick={handleLineClick}
        >
          {connection.action.toUpperCase()}
        </div>
      )}
      
      {/* Hiển thị icon cho hàm nếu có */}
      {connection.function && !showContextMenu && midArrowPoint && (
        <div
          className="absolute bg-purple-50 p-1 rounded-full shadow-sm text-purple-500 z-20 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          style={{ 
            left: `${midArrowPoint.x + 25}px`, // Hiển thị bên phải mũi tên
            top: `${midArrowPoint.y - 10}px` 
          }}
          onClick={handleLineClick}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </div>
      )}
    </>
  );
};

// Component chính để hiển thị workflow
export const WorkflowViewer: React.FC<WorkflowViewerProps> = ({ nodes: initialNodes, connections: initialConnections }) => {
  // State cho các node và kết nối
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [connections, setConnections] = useState<WorkflowConnectionWithAction[]>(
    initialConnections.map(conn => ({ ...conn }))
  );
  
  // State cho node đang được chọn
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // State cho kết nối đang được chọn
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  
  // State cho việc tạo kết nối mới
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [connectionSourcePosition, setConnectionSourcePosition] = useState<string | null>(null);
  
  // State cho menu chỉnh sửa node
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  
  // State cho menu chỉnh sửa kết nối
  const [showConnectionEditor, setShowConnectionEditor] = useState(false);
  
  // Reference đến container chính
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Lấy node đang được chọn
  const selectedNode = selectedNodeId ? nodes.find(node => node.id === selectedNodeId) : null;
  
  // Lấy kết nối đang được chọn
  const selectedConnection = selectedConnectionId ? 
    connections.find(conn => conn.id === selectedConnectionId) : null;
    
  // Effect để lắng nghe sự kiện cập nhật kết nối từ các component con
  useEffect(() => {
    const handleUpdateConnection = (e: Event) => {
      const customEvent = e as CustomEvent<{ connectionId: string; function: string }>;
      const { connectionId, function: functionCode } = customEvent.detail;
      
      // Cập nhật kết nối với hàm mới
      setConnections(prevConnections => 
        prevConnections.map(conn => 
          conn.id === connectionId ? { ...conn, function: functionCode } : conn
        )
      );
    };
    
    // Đăng ký lắng nghe sự kiện
    window.addEventListener('workflow:update-connection', handleUpdateConnection);
    
    // Hủy đăng ký khi component unmount
    return () => {
      window.removeEventListener('workflow:update-connection', handleUpdateConnection);
    };
  }, []);
  
  // Xử lý khi bắt đầu kéo node
  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    e.dataTransfer.setData('nodeId', nodeId);
    // Thêm offset để kéo thả chính xác hơn
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      e.dataTransfer.setData('offsetX', offsetX.toString());
      e.dataTransfer.setData('offsetY', offsetY.toString());
    }
  };
  
  // Xử lý khi kéo over container
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // Xử lý khi thả node
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const nodeId = e.dataTransfer.getData('nodeId');
    const offsetX = parseInt(e.dataTransfer.getData('offsetX'), 10) || 0;
    const offsetY = parseInt(e.dataTransfer.getData('offsetY'), 10) || 0;
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Tính toán vị trí mới
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Cập nhật vị trí của node
      setNodes(prevNodes => prevNodes.map(node => 
        node.id === nodeId ? { ...node, x, y } : node
      ));
    }
  };
  
  // Xử lý khi click vào node
  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setShowNodeEditor(true);
  };
  
  // Xử lý khi click vào connector để bắt đầu tạo kết nối
  const handleConnectorClick = (nodeId: string, position: string) => {
    if (!isCreatingConnection) {
      // Bắt đầu tạo kết nối mới
      setIsCreatingConnection(true);
      setConnectionSource(nodeId);
      setConnectionSourcePosition(position);
    } else {
      // Kết thúc tạo kết nối
      if (connectionSource && connectionSource !== nodeId) {
        // Tạo ID duy nhất cho kết nối mới
        const newConnectionId = `conn-${Date.now()}`;
        // Thêm kết nối mới
        setConnections(prevConnections => [
          ...prevConnections,
          { 
            id: newConnectionId, 
            sourceId: connectionSource, 
            targetId: nodeId,
            sourcePosition: connectionSourcePosition || undefined,
            targetPosition: position
          }
        ]);
      }
      // Reset trạng thái
      setIsCreatingConnection(false);
      setConnectionSource(null);
      setConnectionSourcePosition(null);
    }
  };
  
  // Xử lý khi click vào kết nối
  const handleConnectionClick = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    setSelectedNodeId(null); // Bỏ chọn node nếu có
    setShowNodeEditor(false);
    setShowConnectionEditor(true);
  };
  
  // Xử lý khi xóa kết nối
  const handleDeleteConnection = (connectionId: string) => {
    setConnections(prevConnections => 
      prevConnections.filter(conn => conn.id !== connectionId)
    );
    
    // Reset lựa chọn
    setSelectedConnectionId(null);
    setShowConnectionEditor(false);
  };
  
  // Xử lý thay đổi hành động của kết nối
  const handleActionChange = (action: ConnectionAction) => {
    if (selectedConnectionId) {
      setConnections(prevConnections => 
        prevConnections.map(conn => 
          conn.id === selectedConnectionId ? { ...conn, action } : conn
        )
      );
    }
  };
  
  // Xử lý thay đổi trạng thái của node
  const handleStatusChange = (status: NodeStatus) => {
    if (selectedNodeId) {
      setNodes(prevNodes => prevNodes.map(node => 
        node.id === selectedNodeId ? { ...node, status } : node
      ));
    }
  };
  
  // Xử lý thay đổi hình dạng của node
  const handleShapeChange = (shape: NodeShape) => {
    if (selectedNodeId) {
      setNodes(prevNodes => prevNodes.map(node => 
        node.id === selectedNodeId ? { ...node, shape } : node
      ));
    }
  };
  
  // Xử lý thay đổi màu sắc của node
  const handleColorChange = (color: NodeColor) => {
    if (selectedNodeId) {
      setNodes(prevNodes => prevNodes.map(node => 
        node.id === selectedNodeId ? { ...node, color } : node
      ));
    }
  };
  
  // Xử lý hủy bỏ việc tạo kết nối
  const handleCancelConnection = () => {
    setIsCreatingConnection(false);
    setConnectionSource(null);
  };
  
  // Xử lý khi click ra ngoài để đóng editor
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Đóng tất cả các panel đang mở
      setSelectedNodeId(null);
      setShowNodeEditor(false);
      setSelectedConnectionId(null);
      setShowConnectionEditor(false);
      
      // Nếu đang tạo kết nối, hủy bỏ
      if (isCreatingConnection) {
        setIsCreatingConnection(false);
        setConnectionSource(null);
        setConnectionSourcePosition(null);
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[600px] bg-gray-50 bg-opacity-60 overflow-hidden rounded-lg shadow-inner" 
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleBackgroundClick}
    >
      {/* Lưới nền với kích thước 20x20 pixel */}
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px' 
        }}
      />
      
      {/* Thanh công cụ */}
      <div className="absolute top-4 right-4 flex space-x-2 z-20">
        {isCreatingConnection ? (
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={handleCancelConnection}
          >
            Hủy kết nối
          </Button>
        ) : (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsCreatingConnection(true)}
          >
            Tạo kết nối
          </Button>
        )}
      </div>
      
      {/* Panel chỉnh sửa node */}
      {selectedNode && showNodeEditor && (
        <div className="absolute bottom-4 right-4 w-64 bg-white rounded-lg shadow-lg z-30 border border-gray-200">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-medium">{selectedNode.title}</h3>
            <button 
              onClick={() => setShowNodeEditor(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="p-3">
            <Tabs defaultValue="status">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="status">Trạng thái</TabsTrigger>
                <TabsTrigger value="shape">Hình dạng</TabsTrigger>
                <TabsTrigger value="color">Màu sắc</TabsTrigger>
              </TabsList>
              
              <TabsContent value="status" className="mt-2">
                <div className="flex flex-col space-y-2">
                  <Button 
                    size="sm" 
                    variant={selectedNode.status === 'todo' ? 'default' : 'outline'}
                    className="bg-green-500 hover:bg-green-600 border-green-500"
                    onClick={() => handleStatusChange('todo')}
                  >
                    Cần làm
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedNode.status === 'doing' ? 'default' : 'outline'}
                    className="bg-yellow-500 hover:bg-yellow-600 border-yellow-500"
                    onClick={() => handleStatusChange('doing')}
                  >
                    Đang làm
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedNode.status === 'done' ? 'default' : 'outline'}
                    className="bg-red-500 hover:bg-red-600 border-red-500"
                    onClick={() => handleStatusChange('done')}
                  >
                    Hoàn thành
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="shape" className="mt-2">
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    size="sm" 
                    variant={selectedNode.shape === 'rectangle' ? 'default' : 'outline'}
                    className="aspect-square h-10 p-0" 
                    onClick={() => handleShapeChange('rectangle')}
                  >
                    <div className="w-6 h-6 rounded-none bg-gray-700"></div>
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedNode.shape === 'rounded' ? 'default' : 'outline'}
                    className="aspect-square h-10 p-0" 
                    onClick={() => handleShapeChange('rounded')}
                  >
                    <div className="w-6 h-6 rounded-xl bg-gray-700"></div>
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedNode.shape === 'diamond' ? 'default' : 'outline'}
                    className="aspect-square h-10 p-0" 
                    onClick={() => handleShapeChange('diamond')}
                  >
                    <div className="w-6 h-6 bg-gray-700 transform rotate-45"></div>
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedNode.shape === 'ellipse' ? 'default' : 'outline'}
                    className="aspect-square h-10 p-0" 
                    onClick={() => handleShapeChange('ellipse')}
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-700"></div>
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedNode.shape === 'hexagon' ? 'default' : 'outline'}
                    className="aspect-square h-10 p-0" 
                    onClick={() => handleShapeChange('hexagon')}
                  >
                    <div className="w-6 h-6 bg-gray-700" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="color" className="mt-2">
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    size="sm" 
                    variant={selectedNode.color === 'blue' ? 'default' : 'outline'}
                    className="aspect-square h-10 p-0 bg-blue-50 hover:bg-blue-100 border-blue-200" 
                    onClick={() => handleColorChange('blue')}
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-500"></div>
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedNode.color === 'green' ? 'default' : 'outline'}
                    className="aspect-square h-10 p-0 bg-green-50 hover:bg-green-100 border-green-200" 
                    onClick={() => handleColorChange('green')}
                  >
                    <div className="w-6 h-6 rounded-full bg-green-500"></div>
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedNode.color === 'purple' ? 'default' : 'outline'}
                    className="aspect-square h-10 p-0 bg-purple-50 hover:bg-purple-100 border-purple-200" 
                    onClick={() => handleColorChange('purple')}
                  >
                    <div className="w-6 h-6 rounded-full bg-purple-500"></div>
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedNode.color === 'orange' ? 'default' : 'outline'}
                    className="aspect-square h-10 p-0 bg-orange-50 hover:bg-orange-100 border-orange-200" 
                    onClick={() => handleColorChange('orange')}
                  >
                    <div className="w-6 h-6 rounded-full bg-orange-500"></div>
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedNode.color === 'pink' ? 'default' : 'outline'}
                    className="aspect-square h-10 p-0 bg-pink-50 hover:bg-pink-100 border-pink-200" 
                    onClick={() => handleColorChange('pink')}
                  >
                    <div className="w-6 h-6 rounded-full bg-pink-500"></div>
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedNode.color === 'red' ? 'default' : 'outline'}
                    className="aspect-square h-10 p-0 bg-red-50 hover:bg-red-100 border-red-200" 
                    onClick={() => handleColorChange('red')}
                  >
                    <div className="w-6 h-6 rounded-full bg-red-500"></div>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
      
      {/* Panel chỉnh sửa kết nối */}
      {selectedConnection && showConnectionEditor && (
        <div className="absolute bottom-4 right-4 w-96 bg-white rounded-lg shadow-lg z-30 border border-gray-200 max-h-[500px] overflow-auto">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-medium">Chỉnh sửa kết nối</h3>
            <button 
              onClick={() => {
                setShowConnectionEditor(false);
                setSelectedConnectionId(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className="p-3">
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Từ: {nodes.find(n => n.id === selectedConnection.sourceId)?.title}</p>
              <p className="text-sm font-medium text-gray-700 mb-2">Đến: {nodes.find(n => n.id === selectedConnection.targetId)?.title}</p>
            </div>
            
            <Tabs defaultValue="action">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="action">Hành động</TabsTrigger>
                <TabsTrigger value="function">Hàm xử lý</TabsTrigger>
              </TabsList>
              
              <TabsContent value="action" className="mt-3">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Button 
                    size="sm" 
                    variant={selectedConnection.action === 'proceed' ? 'default' : 'outline'}
                    className="bg-green-500 hover:bg-green-600 border-green-500"
                    onClick={() => handleActionChange('proceed')}
                  >
                    Tiếp tục
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedConnection.action === 'validate' ? 'default' : 'outline'}
                    className="bg-blue-500 hover:bg-blue-600 border-blue-500"
                    onClick={() => handleActionChange('validate')}
                  >
                    Kiểm duyệt
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedConnection.action === 'notify' ? 'default' : 'outline'}
                    className="bg-amber-500 hover:bg-amber-600 border-amber-500"
                    onClick={() => handleActionChange('notify')}
                  >
                    Thông báo
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedConnection.action === 'approve' ? 'default' : 'outline'}
                    className="bg-emerald-500 hover:bg-emerald-600 border-emerald-500"
                    onClick={() => handleActionChange('approve')}
                  >
                    Phê duyệt
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedConnection.action === 'reject' ? 'default' : 'outline'}
                    className="bg-red-500 hover:bg-red-600 border-red-500"
                    onClick={() => handleActionChange('reject')}
                  >
                    Từ chối
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="function" className="mt-3">
                {selectedConnection.function ? (
                  <div className="mb-3">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Mã hàm xử lý:
                    </label>
                    <div className="relative">
                      <textarea 
                        value={selectedConnection.function}
                        onChange={(e) => {
                          // Cập nhật function cho kết nối
                          setConnections(prevConnections => 
                            prevConnections.map(conn => 
                              conn.id === selectedConnectionId 
                                ? { ...conn, function: e.target.value } 
                                : conn
                            )
                          );
                        }}
                        className="w-full h-48 p-2 text-xs font-mono bg-gray-50 border border-gray-300 rounded resize-none"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Hàm này sẽ được gọi khi quá trình di chuyển đến node tiếp theo.
                    </p>
                  </div>
                ) : (
                  <div className="mb-3 text-center">
                    <p className="text-sm text-gray-600 mb-2">Chưa có hàm xử lý nào được thêm</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // Thêm một hàm mẫu cho kết nối
                        const sourceNode = nodes.find(n => n.id === selectedConnection.sourceId);
                        const targetNode = nodes.find(n => n.id === selectedConnection.targetId);
                        const simpleFunctionTemplate = `function handleTransition(data) {
  console.log('Chuyển từ ${sourceNode?.title} đến ${targetNode?.title}', data);
  return data;
}`;
                        
                        // Cập nhật function cho kết nối
                        setConnections(prevConnections => 
                          prevConnections.map(conn => 
                            conn.id === selectedConnectionId 
                              ? { ...conn, function: simpleFunctionTemplate } 
                              : conn
                          )
                        );
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6"></polyline>
                        <polyline points="8 6 2 12 8 18"></polyline>
                      </svg>
                      Thêm hàm xử lý
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <Button 
              size="sm" 
              variant="destructive"
              className="w-full mt-3"
              onClick={() => handleDeleteConnection(selectedConnection.id)}
            >
              Xóa kết nối
            </Button>
          </div>
        </div>
      )}

      {/* Hiển thị các liên kết giữa các node */}
      {connections.map((connection) => {
        const sourceNode = nodes.find((node) => node.id === connection.sourceId);
        const targetNode = nodes.find((node) => node.id === connection.targetId);
        
        if (sourceNode && targetNode) {
          return (
            <WorkflowConnection
              key={connection.id}
              connection={connection}
              sourceNode={sourceNode}
              targetNode={targetNode}
              onConnectionClick={handleConnectionClick}
              onDeleteConnection={handleDeleteConnection}
              isSelected={connection.id === selectedConnectionId}
            />
          );
        }
        
        return null;
      })}
      
      {/* Hiển thị các node */}
      {nodes.map((node) => (
        <WorkflowNode 
          key={node.id} 
          node={node} 
          onDragStart={handleDragStart}
          onDrop={() => {}} // Không xử lý drop trên node
          onDragOver={handleDragOver}
          onNodeClick={handleNodeClick}
          onConnectorClick={handleConnectorClick}
          isSelected={node.id === selectedNodeId}
          isDrawingConnection={isCreatingConnection}
        />
      ))}
      
      {/* Hiển thị đường kết nối đang được tạo */}
      {isCreatingConnection && connectionSource && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute text-center top-20 left-1/2 transform -translate-x-1/2 bg-yellow-100 p-2 rounded-lg shadow-md">
            <p className="text-sm font-medium text-yellow-800">
              Đang tạo kết nối từ "{nodes.find(n => n.id === connectionSource)?.title}"
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Click vào điểm kết nối của node khác để hoàn thành
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// CSS tùy chỉnh cho hình dáng lục giác
// Được thêm vào file index.css bằng cách sử dụng class này
// .clip-path-hexagon {
//   clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
// }