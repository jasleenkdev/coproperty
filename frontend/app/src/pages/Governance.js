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
  Modal,
  PageLoader,
  Select,
  Spinner,
  TextArea,
  Input,
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
  const [filter, setFilter] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const props = await getProperties();
      setProperties(props);

      const allProposals = [];

      for (const prop of props) {
        const propProposals = await getPropertyProposals(prop.id);

        propProposals.forEach((p) => {
          allProposals.push({
            ...p,
            property_id: prop.id,
            property_name: prop.name,
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
    if (filter === "active") return p.status === "ACTIVE";
    if (filter === "approved") return p.status === "APPROVED";
    if (filter === "rejected") return p.status === "REJECTED";
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
              Create Proposal
            </Button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "all", label: "All" },
          { key: "active", label: "Active" },
          { key: "approved", label: "Approved" },
          { key: "rejected", label: "Rejected" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === key
                ? "bg-primary-600 text-white"
                : "bg-white border border-gray-200"
            }`}
          >
            {label}
            {key !== "all" && (
              <span className="ml-2 text-xs">
                {
                  proposals.filter((p) => {
                    if (key === "active") return p.status === "ACTIVE";
                    if (key === "approved") return p.status === "APPROVED";
                    if (key === "rejected") return p.status === "REJECTED";
                  }).length
                }
              </span>
            )}
          </button>
        ))}
      </div>

      {!isConnected && (
        <Alert variant="warning" className="mb-6">
          Connect wallet to vote.
        </Alert>
      )}

      {filteredProposals.length > 0 ? (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              account={account}
              isConnected={isConnected}
              onVote={fetchData}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          No proposals found.
        </Card>
      )}

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

function ProposalCard({ proposal, isConnected, account, onVote }) {
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState(null);

  const totalWeight = proposal.total_weight;

  const participation = proposal.votes_for + proposal.votes_against;

  const forPercentage =
    totalWeight > 0 ? (proposal.votes_for / totalWeight) * 100 : 0;

  const againstPercentage =
    totalWeight > 0 ? (proposal.votes_against / totalWeight) * 100 : 0;

  const handleVote = async (voteFor) => {
    if (!isConnected) return;

    setVoting(true);
    setVoteError(null);

    try {
      const result = await voteOnProposal(proposal.id, voteFor, account);

      if (result.success) {
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

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 p-6">
          <div className="flex gap-2 mb-3">

            {proposal.status === "ACTIVE" && (
              <Badge variant="warning">Active</Badge>
            )}

            {proposal.status === "APPROVED" && (
              <Badge variant="success">Approved</Badge>
            )}

            {proposal.status === "REJECTED" && (
              <Badge variant="danger">Rejected</Badge>
            )}

          </div>

          <h3 className="text-lg font-semibold">{proposal.title}</h3>
          <p className="text-gray-600 text-sm">{proposal.description}</p>

          <p className="text-sm text-gray-500 mt-2">
            Property: {proposal.property_name}
          </p>
        </div>

        {/* Voting */}
        <div className="lg:w-72 bg-gray-50 p-6 border-l">

          <div className="mb-4">

            <div className="flex justify-between text-sm mb-2">
              <span className="text-green-600">
                For: {proposal.votes_for}
              </span>

              <span className="text-red-600">
                Against: {proposal.votes_against}
              </span>
            </div>

            <div className="h-3 bg-gray-200 rounded-full flex overflow-hidden">

              <div
                className="bg-green-500"
                style={{ width: `${forPercentage}%` }}
              />

              <div
                className="bg-red-500"
                style={{ width: `${againstPercentage}%` }}
              />

            </div>

            <p className="text-xs text-gray-400 mt-1 text-center">
              Participation: {participation} / {totalWeight}
            </p>

          </div>

          {proposal.status === "ACTIVE" && isConnected && (

            <div className="grid grid-cols-2 gap-2">

              <Button
                variant="success"
                size="sm"
                disabled={voting}
                onClick={() => handleVote(true)}
              >
                {voting ? <Spinner size="sm" /> : "👍 For"}
              </Button>

              <Button
                variant="danger"
                size="sm"
                disabled={voting}
                onClick={() => handleVote(false)}
              >
                {voting ? <Spinner size="sm" /> : "👎 Against"}
              </Button>

            </div>

          )}

          {!isConnected && proposal.status === "ACTIVE" && (
            <p className="text-xs text-gray-500 text-center">
              Connect wallet to vote
            </p>
          )}

          {voteError && (
            <p className="text-xs text-red-500 mt-2">{voteError}</p>
          )}

        </div>
      </div>
    </Card>
  );
}

function CreateProposalModal({ isOpen, onClose, properties, onSuccess }) {

  const [formData, setFormData] = useState({
    propertyId: "",
    title: "",
    description: "",
    proposalType: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {

    e.preventDefault();
    setLoading(true);

    try {

      const result = await createProposal(
        formData.propertyId,
        formData.title,
        formData.description,
        formData.proposalType
      );

      if (result.success) {
        onSuccess();
      }

    } finally {
      setLoading(false);
    }

  };

  const propertyOptions = properties.map((p) => ({
    value: p.id.toString(),
    label: p.name,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Proposal">

      <form onSubmit={handleSubmit} className="space-y-4">

        <Select
          label="Property"
          options={propertyOptions}
          value={formData.propertyId}
          onChange={(e) =>
            setFormData({ ...formData, propertyId: e.target.value })
          }
          required
        />

        <Select
          label="Proposal Type"
          options={PROPOSAL_TYPES}
          value={formData.proposalType}
          onChange={(e) =>
            setFormData({ ...formData, proposalType: e.target.value })
          }
          required
        />

        <Input
          label="Title"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          required
        />

        <TextArea
          label="Description"
          rows={4}
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          required
        />

        <Button type="submit" loading={loading}>
          Create Proposal
        </Button>

      </form>

    </Modal>
  );
}