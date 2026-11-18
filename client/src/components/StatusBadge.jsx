import StatusPill from './dashboard/StatusPill'

const StatusBadge = ({ status }) => <StatusPill status={status?.toLowerCase()} />

export default StatusBadge