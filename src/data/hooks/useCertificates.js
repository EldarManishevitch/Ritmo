import { useQuery } from '@tanstack/react-query';
import { certificatesRepo } from '@/data/repositories/certificates.repo';
import { queryKeys } from '@/data/queryKeys';

export function useCertificatesList(options = {}) {
  return useQuery({
    queryKey: queryKeys.certificates.list,
    queryFn: () => certificatesRepo.list(),
    ...options,
  });
}
