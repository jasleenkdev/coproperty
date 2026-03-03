// Governance Page - Proposals and Voting
import { useCallback, useEffect, useState } from "react";
import {
  createProposal,
  getProperties,
  getPropertyProposals,
  voteOnProposal,
} from "../api/api";
import { useWallet } from "../blockchain/WalletContext";
import { PageHeader } from "../components/layout/Layout";
import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  Modal,
  PageLoader,
  Select,
  Spinner,
  TextArea,
} from "../components/ui";

const PROPOSAL_TYPES = [
  { value: "RENT_CHANGE", label: "Change Rent" },
  { value: "MAINTENANCE", label: "Approve Maintenance" },
  { value: "SELL", label: "Sell Property" },
  { value: "BUY", label: "Buy New Property" },
];

export default function Governance() {
  const { account, isConnected } = useWallet();

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState("all"); // all, active, approved

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const props = await getProperties();
      setProperties(props);

      // Fetch proposals for all properties
      const allProposals = [];
      for (const prop of props) {
        const propProposals = await getPropertyProposals(prop.id);
        propProposals.forEach((p) => {
          allProposals.push({
            ...p,
            property_id: prop.id,
            property_name: prop.name,
            property_location: prop.location,
          });
        });
      }
      setProposals(allProposals);
    } catch (error) {
      console.error("Error fetching governance data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProposals = proposals.filter((p) => {
    if (filter === "active") return !p.approved && !p.is_executed;
    if (filter === "approved") return p.approved;
    return true;
  });

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Governance"
        description="Create proposals and vote on property decisions"
        actions={
          isConnected && (
            <Button onClick={() => setShowCreateModal(true)}>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Proposal
            </Button>
          )
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "all", label: "All Proposals" },
          { key: "active", label: "Active" },
          { key: "approved", label: "Approved" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                filter === key
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }
            `}
          >
            {label}
            {key !== "all" && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/20">
                {
                  proposals.filter((p) =>
                    key === "active"
                      ? !p.approved && !p.is_executed
                      : p.approved,
                  ).length
                }
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Not Connected Alert */}
      {!isConnected && (
        <Alert variant="warning" className="mb-6">
          <strong>Connect your wallet</strong> to create proposals and vote on
          decisions.
        </Alert>
      )}

      {/* Proposals List */}
      {filteredProposals.length > 0 ? (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              isConnected={isConnected}
              account={account}
              onVote={fetchData}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Proposals Found
          </h3>
          <p className="text-gray-500 mb-6">
            {filter === "all"
              ? "Be the first to create a governance proposal"
              : `No ${filter} proposals at the moment`}
          </p>
          {isConnected && filter === "all" && (
            <Button onClick={() => setShowCreateModal(true)}>
              Create First Proposal
            </Button>
          )}
        </Card>
      )}

      {/* Create Proposal Modal */}
      <CreateProposalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        properties={properties}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchData();
        }}
      />
    </div>
  );
}

// Proposal Card Component
function ProposalCard({ proposal, isConnected, account, onVote }) {
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  const totalVotes = proposal.votes_for + proposal.votes_against;
  const forPercentage =
    totalVotes > 0 ? (proposal.votes_for / totalVotes) * 100 : 50;
  const againstPercentage =
    totalVotes > 0 ? (proposal.votes_against / totalVotes) * 100 : 50;

  const handleVote = async (voteFor) => {
    if (!isConnected) return;

    setVoting(true);
    setVoteError(null);

    try {
      const result = await voteOnProposal(proposal.id, voteFor, account);
      if (result.success) {
        setHasVoted(true);
        onVote();
      } else {
        setVoteError(result.error || "Vote failed");
      }
    } catch (error) {
      setVoteError(error.message);
    } finally {
      setVoting(false);
    }
  };

  const getTypeLabel = (type) => {
    const found = PROPOSAL_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  const getTypeBadgeVariant = (type) => {
    switch (type) {
      case "RENT_CHANGE":
        return "primary";
      case "MAINTENANCE":
        return "warning";
      case "SELL":
        return "danger";
      case "BUY":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="flex flex-wrap items-start gap-2 mb-3">
            <Badge variant={getTypeBadgeVariant(proposal.proposal_type)}>
              {getTypeLabel(proposal.proposal_type)}
            </Badge>
            {proposal.approved && (
              <Badge variant="success" dot>
                Approved
              </Badge>
            )}
            {proposal.is_executed && <Badge variant="default">Executed</Badge>}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {proposal.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4">{proposal.description}</p>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              {proposal.property_name}
            </div>
            {proposal.created_at && (
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {new Date(proposal.created_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Voting Section */}
        <div className="lg:w-72 bg-gray-50 p-6 border-t lg:border-t-0 lg:border-l border-gray-100">
          {/* Vote Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-success-600 font-medium">
                For: {proposal.votes_for}
              </span>
              <span className="text-danger-600 font-medium">
                Against: {proposal.votes_against}
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
              <div
                className="bg-success-500 transition-all duration-300"
                style={{ width: `${forPercentage}%` }}
              />
              <div
                className="bg-danger-500 transition-all duration-300"
                style={{ width: `${againstPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-center">
              Total: {totalVotes} votes
            </p>
          </div>

          {/* Vote Buttons */}
          {!proposal.approved && !hasVoted && isConnected && (
            <div className="space-y-2">
              {voteError && (
                <p className="text-xs text-danger-500 mb-2">{voteError}</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleVote(true)}
                  disabled={voting}
                  className="w-full"
                >
                  {voting ? <Spinner size="sm" /> : "👍 For"}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleVote(false)}
                  disabled={voting}
                  className="w-full"
                >
                  {voting ? <Spinner size="sm" /> : "👎 Against"}
                </Button>
              </div>
            </div>
          )}

          {hasVoted && (
            <Alert variant="success" className="text-center">
              <span className="text-xs">Vote recorded!</span>
            </Alert>
          )}

          {proposal.approved && (
            <div className="text-center">
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg
                  className="w-6 h-6 text-success-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-success-600">
                Proposal Approved
              </p>
            </div>
          )}

          {!isConnected && !proposal.approved && (
            <p className="text-xs text-gray-500 text-center">
              Connect wallet to vote
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

// Create Proposal Modal
function CreateProposalModal({ isOpen, onClose, properties, onSuccess }) {
  const [formData, setFormData] = useState({
    propertyId: "",
    title: "",
    description: "",
    proposalType: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await createProposal(
        formData.propertyId,
        formData.title,
        formData.description,
        formData.proposalType,
      );

      if (result.success) {
        setFormData({
          propertyId: "",
          title: "",
          description: "",
          proposalType: "",
        });
        onSuccess();
      } else {
        setError(result.error || "Failed to create proposal");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const propertyOptions = properties.map((p) => ({
    value: p.id.toString(),
    label: p.name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Proposal"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {error && (
            <Alert variant="error" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Select
            label="Property"
            options={propertyOptions}
            value={formData.propertyId}
            onChange={(e) =>
              setFormData({ ...formData, propertyId: e.target.value })
            }
            placeholder="Select a property"
            required
          />

          <Select
            label="Proposal Type"
            options={PROPOSAL_TYPES}
            value={formData.proposalType}
            onChange={(e) =>
              setFormData({ ...formData, proposalType: e.target.value })
            }
            placeholder="Select proposal type"
            required
          />

          <Input
            label="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Enter proposal title"
            required
          />

          <TextArea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe your proposal in detail..."
            rows={4}
            required
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={
              loading ||
              !formData.propertyId ||
              !formData.title ||
              !formData.proposalType
            }
          >
            {loading ? "Creating..." : "Create Proposal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
